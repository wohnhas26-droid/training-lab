// Pure helpers for coach roster stats and recent activity.
// Dates are YYYY-MM-DD (UTC, matching lastTrainingDate / completedSession.date).

export function dateKey(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

export function formatLastActive(lastTrainingDate, now = new Date()) {
  const then = dateKey(lastTrainingDate);
  if (!then) return 'Never';
  const today = now.toISOString().split('T')[0];
  if (then === today) return 'Today';
  const ms = Date.parse(`${today}T00:00:00.000Z`) - Date.parse(`${then}T00:00:00.000Z`);
  if (Number.isNaN(ms)) return 'Never';
  if (ms < 0) return then;
  const days = Math.round(ms / 86400000);
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  return then;
}

export function serializeTeamPlayer(member, now = new Date()) {
  const user = member?.user || {};
  const progress = user.progress || {};
  const lastTrainingDate = progress.lastTrainingDate || null;
  return {
    id: user.id,
    name: user.name,
    position: user.profile?.position || 'Player',
    xp: progress.xp || 0,
    streak: progress.streak || 0,
    completion: Math.min(100, Math.round(((progress.skillsCompleted || 0) / 50) * 100)),
    lastTrainingDate,
    lastActive: formatLastActive(lastTrainingDate, now),
  };
}

export function computeTeamStats(players) {
  const list = Array.isArray(players) ? players : [];
  if (!list.length) {
    return { playerCount: 0, activeToday: 0, avgCompletion: 0, topStreak: 0 };
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

function toIso(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

export function buildTeamActivity({ sessions = [], videos = [], completions = [] } = {}, now = new Date()) {
  const items = [];

  for (const s of sessions) {
    const playerName = s.user?.name || 'Player';
    const at = s.createdAt || s.date;
    items.push({
      id: `session:${s.id}`,
      type: 'session',
      playerId: s.userId || s.user?.id || null,
      playerName,
      text: `${playerName} completed training`,
      at: toIso(at),
      when: formatLastActive(dateKey(at), now),
    });
  }

  for (const v of videos) {
    const playerName = v.player?.name || 'Player';
    const skill = v.skill || 'skill';
    items.push({
      id: `video:${v.id}`,
      type: 'video',
      playerId: v.playerId || v.player?.id || null,
      playerName,
      text: `${playerName} submitted a ${skill} video`,
      at: toIso(v.createdAt),
      when: formatLastActive(dateKey(v.createdAt), now),
    });
  }

  for (const c of completions) {
    const playerName = c.player?.name || 'Player';
    const title = c.assignment?.title || 'an assignment';
    items.push({
      id: `assignment:${c.id}`,
      type: 'assignment',
      playerId: c.playerId || c.player?.id || null,
      playerName,
      text: `${playerName} completed ${title}`,
      at: toIso(c.completedAt),
      when: formatLastActive(dateKey(c.completedAt), now),
    });
  }

  return items.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
