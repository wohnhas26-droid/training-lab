export function challengeCardStatus({ completed, joined, progress, targetCount } = {}) {
  const target = Number(targetCount) || 0;
  const current = Number(progress) || 0;
  if (completed || (target > 0 && current >= target)) return 'completed';
  if (joined) return 'active';
  return 'available';
}

export function hydrateChallenges(catalog, state = null) {
  const list = Array.isArray(catalog) ? catalog : [];
  return list.map((c) => {
    if (state) {
      const progress = Number(state.challengeProgress?.[c.id]) || 0;
      const completed = (state.completedChallenges || []).includes(c.id)
        || (c.targetCount > 0 && progress >= c.targetCount);
      const joined = (state.activeChallenges || []).includes(c.id) || completed;
      return { ...c, progress, completed, joined };
    }
    const progress = Number(c.progress) || 0;
    const completed = Boolean(c.completed) || (c.targetCount > 0 && progress >= c.targetCount);
    return { ...c, progress, completed, joined: Boolean(c.joined) || completed };
  });
}

export const CHALLENGES_LOAD_FAILED =
  'Could not load challenges right now. Try again in a moment.';

export function renderChallengesLoadFailed() {
  return `<p style="color: var(--slate-500);">${CHALLENGES_LOAD_FAILED}</p>`;
}

export function renderChallengeCards(challenges, { escapeHtml } = {}) {
  if (!Array.isArray(challenges)) {
    return renderChallengesLoadFailed();
  }
  const list = challenges;
  if (!list.length) {
    return '<p style="color: var(--slate-500);">No challenges available.</p>';
  }
  return list.map((c) => {
    const progress = Number(c.progress) || 0;
    const target = Number(c.targetCount) || 0;
    const pct = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;
    const status = challengeCardStatus(c);
    const unit = escapeHtml(c.unit || '');

    let action = `
          <button class="btn btn-primary btn-block challenge-join" data-id="${escapeHtml(c.id)}" style="margin-top: 1rem;">
            Join Challenge
          </button>`;
    if (status === 'completed') {
      action = `
            <div class="challenge-progress">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem;">
                <span>${progress}/${target} ${unit}</span>
                <span>100%</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width: 100%"></div></div>
              <span class="badge badge-green" style="margin-top: 0.75rem; display: inline-block;">Completed</span>
            </div>`;
    } else if (status === 'active') {
      action = `
            <div class="challenge-progress">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem;">
                <span>${progress}/${target} ${unit}</span>
                <span>${pct}%</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
              <button class="btn btn-secondary btn-sm btn-block challenge-log" data-id="${escapeHtml(c.id)}" style="margin-top: 0.75rem;">
                Log Progress (+1)
              </button>
            </div>`;
    }

    return `
          <div class="challenge-card">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <span style="font-size: 2rem;">${escapeHtml(c.icon || '')}</span>
                <h3 class="card-title" style="margin-top: 0.5rem;">${escapeHtml(c.name)}</h3>
              </div>
              <span class="badge ${status === 'completed' ? 'badge-green' : 'badge-gold'}">+${Number(c.xpReward) || 0} XP</span>
            </div>
            <p style="color: var(--slate-400); margin: 0.75rem 0; font-size: 0.9rem;">${escapeHtml(c.description)}</p>
            <p style="font-size: 0.8rem; color: var(--slate-500);">${Number(c.duration) || 0} days · Target: ${target} ${unit}</p>
            ${action}
          </div>
        `;
  }).join('');
}
