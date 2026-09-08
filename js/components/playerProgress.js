export const PROGRESS_SUMMARY_LOAD_FAILED =
  'Could not load your progress stats right now. Try again in a moment.';

export function renderProgressSummaryLoadFailed() {
  return `<p style="color: var(--slate-500);">${PROGRESS_SUMMARY_LOAD_FAILED}</p>`;
}

export function renderDashboardStats(summary) {
  const s = summary || {};
  return `
      <div class="stat-card"><div class="stat-value">${Number(s.streak) || 0}</div><div class="stat-label">Day Streak</div></div>
      <div class="stat-card"><div class="stat-value">${Number(s.xp) || 0}</div><div class="stat-label">Total XP</div></div>
      <div class="stat-card"><div class="stat-value">${Number(s.minutesTrained) || 0}</div><div class="stat-label">Minutes Trained</div></div>
      <div class="stat-card"><div class="stat-value">${Number(s.achievementsUnlocked) || 0}/${Number(s.totalAchievements) || 0}</div><div class="stat-label">Achievements</div></div>
    `;
}

export function renderLevelInfo(summary) {
  const s = summary || {};
  const level = s.level || { icon: '', name: 'Rookie' };
  const pct = Math.max(0, Math.min(100, Number(s.levelProgress) || 0));
  const next = s.nextLevel
    ? `${Math.round(pct)}% to ${s.nextLevel.name}`
    : 'Max level reached!';
  return `
      <div class="level-badge" style="margin-bottom: 1rem;">${level.icon || ''} ${level.name || 'Rookie'}</div>
      <div class="progress-bar" style="margin-bottom: 0.5rem;"><div class="progress-fill" style="width: ${pct}%"></div></div>
      <p style="font-size: 0.85rem; color: var(--slate-400);">${next}</p>
    `;
}

export function renderProgressStats(summary) {
  const s = summary || {};
  return `
      <div class="stat-card"><div class="stat-value">${Number(s.streak) || 0}</div><div class="stat-label">Current Streak</div></div>
      <div class="stat-card"><div class="stat-value">${Number(s.skillsCompleted) || 0}</div><div class="stat-label">Skills Completed</div></div>
      <div class="stat-card"><div class="stat-value">${Number(s.weeklySessions) || 0}</div><div class="stat-label">Sessions This Week</div></div>
      <div class="stat-card"><div class="stat-value">${Number(s.minutesTrained) || 0}</div><div class="stat-label">Total Minutes</div></div>
    `;
}

export function renderLevelTrack(levels, xp, { escapeHtml } = {}) {
  const list = Array.isArray(levels) ? levels : [];
  const currentXp = Number(xp) || 0;
  return list.map((level) => {
    const reached = currentXp >= (Number(level.minXp) || 0);
    const name = escapeHtml ? escapeHtml(level.name) : level.name;
    return `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--slate-800); opacity: ${reached ? 1 : 0.4};">
          <span style="font-size: 1.5rem;">${level.icon || ''}</span>
          <div style="flex: 1;">
            <div style="font-weight: 700; color: ${reached ? 'var(--green-400)' : 'var(--slate-400)'};">${name}</div>
            <div style="font-size: 0.8rem; color: var(--slate-500);">${Number(level.minXp) || 0} XP required</div>
          </div>
          ${reached ? '<span class="badge badge-green">Unlocked</span>' : ''}
        </div>
      `;
  }).join('');
}

export const ACHIEVEMENTS_LOAD_FAILED =
  'Could not load achievements right now. Try again in a moment.';

export function renderAchievementsLoadFailed() {
  return `<p style="color: var(--slate-500);">${ACHIEVEMENTS_LOAD_FAILED}</p>`;
}

export function renderAchievements(achievements, unlockedIds, { escapeHtml } = {}) {
  if (!Array.isArray(achievements)) {
    return renderAchievementsLoadFailed();
  }
  const list = achievements;
  const unlocked = new Set(unlockedIds || []);
  return list.map((a) => {
    const on = unlocked.has(a.id);
    const name = escapeHtml ? escapeHtml(a.name) : a.name;
    const description = escapeHtml ? escapeHtml(a.description) : a.description;
    return `
        <div class="achievement ${on ? 'unlocked' : ''}">
          <div class="achievement-icon">${a.icon || ''}</div>
          <div class="achievement-name">${name}</div>
          <div style="font-size: 0.7rem; color: var(--slate-500); margin-top: 0.25rem;">${description}</div>
        </div>
      `;
  }).join('');
}

export const TODAY_TRAINING_LOAD_FAILED =
  "Could not load today's training right now. Try again in a moment.";

export function renderTodayTrainingLoadFailed() {
  return `<p style="color: var(--slate-500);">${TODAY_TRAINING_LOAD_FAILED}</p>`;
}

export function isRestSession(session) {
  if (!session) return false;
  if (session.rest) return true;
  return !session.exercises || session.exercises.length === 0;
}

export function renderSessionCta(session) {
  if (isRestSession(session)) {
    return `<a href="/player/training.html" class="btn btn-secondary btn-block" id="start-session-btn" style="margin-top: 1rem;">View rest day</a>`;
  }
  return `<a href="/player/training.html" class="btn btn-primary btn-block" id="start-session-btn" style="margin-top: 1rem;">Start Session</a>`;
}

export const EVALUATION_LOCKED =
  'Monthly evaluations are included with Elite Membership. Your current plan does not include them.';

export function renderEvaluationLocked() {
  return `
    <p style="color: var(--slate-300);">${EVALUATION_LOCKED}</p>
    <a href="/pricing.html" class="btn btn-primary" style="margin-top: 1rem;">View Plans</a>
  `;
}

export const EVALUATION_LOAD_FAILED =
  'Could not load your monthly evaluation right now. Try again in a moment.';

export function renderEvaluationLoadFailed() {
  return `<p style="color: var(--slate-500);">${EVALUATION_LOAD_FAILED}</p>`;
}

export function renderEvaluation(evaluation, { escapeHtml } = {}) {
  if (!evaluation) return '';
  const esc = escapeHtml || ((v) => String(v ?? ''));
  const rating = Number(evaluation.overallRating);
  const score = Number.isFinite(rating) ? String(rating) : '—';
  const strengths = Array.isArray(evaluation.strengths) ? evaluation.strengths : [];
  const improvements = Array.isArray(evaluation.improvements) ? evaluation.improvements : [];
  const strengthList = strengths.length
    ? strengths.map((s) => `<li>${esc(s)}</li>`).join('')
    : '<li>Good foundation to build upon</li>';
  const improveList = improvements.length
    ? improvements.map((s) => `<li>${esc(s)}</li>`).join('')
    : '<li>Maintain current training intensity</li>';
  return `
        <p style="font-size: 2rem; font-weight: 800; color: var(--green-400);">${esc(score)}/10</p>
        <p style="margin: 1rem 0; color: var(--slate-300);">${esc(evaluation.recommendation)}</p>
        <div class="grid grid-2" style="margin-top: 1rem;">
          <div><strong style="color: var(--green-400);">Strengths</strong><ul style="margin-top: 0.5rem; padding-left: 1.25rem; color: var(--slate-400);">${strengthList}</ul></div>
          <div><strong style="color: var(--gold);">Improve</strong><ul style="margin-top: 0.5rem; padding-left: 1.25rem; color: var(--slate-400);">${improveList}</ul></div>
        </div>
      `;
}
