import { formatProfileLabel } from './ui.js';

export const COACH_TEAM_LOAD_FAILED =
  'Could not load your roster right now. Try again in a moment.';

export function renderCoachTeamLoadFailed() {
  return `<p style="color: var(--slate-500);">${COACH_TEAM_LOAD_FAILED}</p>`;
}

export function renderCoachTeamLoadFailedRow(colspan = 5) {
  return `<tr><td colspan="${colspan}" style="color: var(--slate-500);">${COACH_TEAM_LOAD_FAILED}</td></tr>`;
}

export function emptyCoachTeamSnapshot() {
  return {
    players: [],
    activity: [],
    stats: { playerCount: 0, activeToday: 0, avgCompletion: 0, topStreak: 0 },
  };
}

export function coachTeamStats(players, provided) {
  if (provided && Number.isFinite(Number(provided.playerCount))) {
    return {
      playerCount: Number(provided.playerCount) || 0,
      activeToday: Number(provided.activeToday) || 0,
      avgCompletion: Number(provided.avgCompletion) || 0,
      topStreak: Number(provided.topStreak) || 0,
    };
  }
  const list = Array.isArray(players) ? players : [];
  if (!list.length) {
    return emptyCoachTeamSnapshot().stats;
  }
  const completions = list.map((p) => Number(p.completion) || 0);
  const streaks = list.map((p) => Number(p.streak) || 0);
  return {
    playerCount: list.length,
    activeToday: list.filter((p) => p.lastActive === 'Today').length,
    avgCompletion: Math.round(completions.reduce((s, n) => s + n, 0) / list.length),
    topStreak: Math.max(0, ...streaks),
  };
}

export function renderCoachStats(stats) {
  const s = coachTeamStats([], stats);
  return `
      <div class="stat-card"><div class="stat-value">${s.playerCount}</div><div class="stat-label">Players</div></div>
      <div class="stat-card"><div class="stat-value">${s.activeToday}</div><div class="stat-label">Active Today</div></div>
      <div class="stat-card"><div class="stat-value">${s.avgCompletion}%</div><div class="stat-label">Avg Completion</div></div>
      <div class="stat-card"><div class="stat-value">${s.topStreak}</div><div class="stat-label">Top Streak</div></div>
    `;
}

function playerHref(id) {
  return `/coach/player.html?id=${encodeURIComponent(id)}`;
}

export function renderCoachLeaderboardRows(players, { escapeHtml }) {
  if (!Array.isArray(players)) {
    return renderCoachTeamLoadFailedRow(5);
  }
  if (!players.length) {
    return '<tr><td colspan="5" style="color: var(--slate-500);">No players on your roster yet.</td></tr>';
  }
  return players.slice(0, 5).map((p, i) => `
      <tr>
        <td><span class="leaderboard-rank rank-${i < 3 ? i + 1 : 'other'}">${i + 1}</span></td>
        <td>
          <a href="${playerHref(p.id)}"><strong>${escapeHtml(p.name)}</strong></a>
          <br><span style="font-size: 0.8rem; color: var(--slate-500);">${escapeHtml(formatProfileLabel(p.position) || 'Player')}</span>
        </td>
        <td>${Number(p.xp).toLocaleString()}</td>
        <td>${Number(p.streak) || 0} days</td>
        <td>${Number(p.completion) || 0}%</td>
      </tr>
    `).join('');
}

export function renderCoachActivity(activity, { escapeHtml }) {
  if (!Array.isArray(activity)) {
    return renderCoachTeamLoadFailed();
  }
  if (!activity.length) {
    return '<p style="color: var(--slate-500);">No recent team activity yet.</p>';
  }
  return activity.map((item) => {
    const name = escapeHtml(item.playerName || 'Player');
    const label = escapeHtml(item.text || '');
    const when = escapeHtml(item.when || '');
    const inner = item.playerId
      ? `<a href="${playerHref(item.playerId)}">${label || name}</a>`
      : `<span>${label || name}</span>`;
    return `
      <div style="display: flex; justify-content: space-between; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--slate-800);">
        ${inner}
        <span style="color: var(--slate-500); font-size: 0.85rem; white-space: nowrap;">${when}</span>
      </div>
    `;
  }).join('');
}

export function renderCoachLeaderboardPage(players, { escapeHtml }) {
  if (!Array.isArray(players)) {
    return `<p style="color: var(--slate-500); padding: 1rem;">${COACH_TEAM_LOAD_FAILED}</p>`;
  }
  if (!players.length) {
    return '<p style="color: var(--slate-500); padding: 1rem;">No players on your roster yet.</p>';
  }
  return players.map((p, i) => `
      <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--slate-800);">
        <span class="leaderboard-rank rank-${i < 3 ? i + 1 : 'other'}">${i + 1}</span>
        <div style="flex: 1;">
          <a href="${playerHref(p.id)}"><strong>${escapeHtml(p.name)}</strong></a>
          <div style="font-size: 0.85rem; color: var(--slate-500);">${escapeHtml(formatProfileLabel(p.position) || 'Player')}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; color: var(--green-400);">${Number(p.xp).toLocaleString()} XP</div>
          <div style="font-size: 0.8rem; color: var(--slate-500);">${Number(p.streak) || 0} day streak · ${Number(p.completion) || 0}% complete</div>
        </div>
      </div>
    `).join('');
}
