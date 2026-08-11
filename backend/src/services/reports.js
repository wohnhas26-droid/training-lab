// Derive monthly report cards from a player's completed training sessions.
// Pure function so it can be unit-tested without a database.

function monthKey(date) {
  // completedSession.date is a 'YYYY-MM-DD' string.
  return typeof date === 'string' ? date.slice(0, 7) : null;
}

function consistencyLabel(sessions) {
  if (sessions >= 12) return 'Excellent';
  if (sessions >= 6) return 'Good';
  if (sessions > 0) return 'Getting started';
  return 'No activity';
}

export function monthlyReports(completedSessions, { now = new Date(), months = 4 } = {}) {
  const buckets = new Map();
  for (const s of completedSessions || []) {
    const key = monthKey(s?.date);
    if (!key) continue;
    const b = buckets.get(key) || { sessions: 0, minutes: 0, xp: 0, skills: 0 };
    b.sessions += 1;
    b.minutes += s.minutes || 0;
    b.xp += s.xp || 0;
    b.skills += Array.isArray(s.exercises) ? s.exercises.length : 0;
    buckets.set(key, b);
  }

  const reports = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const b = buckets.get(key) || { sessions: 0, minutes: 0, xp: 0, skills: 0 };
    reports.push({
      key,
      label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      sessions: b.sessions,
      minutes: b.minutes,
      xp: b.xp,
      skills: b.skills,
      // 0 when there was no activity; otherwise 5–10 scaled by sessions.
      score: b.sessions === 0 ? 0 : Math.max(1, Math.min(10, 4 + b.sessions)),
      consistency: consistencyLabel(b.sessions),
    });
  }
  return reports;
}
