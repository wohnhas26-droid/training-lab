import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyReports } from '../src/services/reports.js';

// Fixed "now" so month buckets are deterministic (June 15, 2026).
const now = new Date(2026, 5, 15);

const sessions = [
  { date: '2026-06-02', minutes: 30, xp: 60, exercises: ['a', 'b'] },
  { date: '2026-06-09', minutes: 20, xp: 40, exercises: ['a'] },
  { date: '2026-05-05', minutes: 30, xp: 50, exercises: ['a', 'b', 'c'] },
  { date: '2026-05-20', minutes: 30, xp: 50, exercises: ['a'] },
  { date: '2026-05-25', minutes: 30, xp: 50, exercises: ['a'] },
];

test('returns the requested number of months, newest first', () => {
  const r = monthlyReports(sessions, { now, months: 4 });
  assert.equal(r.length, 4);
  assert.deepEqual(r.map(m => m.key), ['2026-06', '2026-05', '2026-04', '2026-03']);
  assert.equal(r[0].label, 'June 2026');
});

test('aggregates sessions/minutes/xp/skills per month', () => {
  const r = monthlyReports(sessions, { now, months: 4 });
  const june = r.find(m => m.key === '2026-06');
  assert.equal(june.sessions, 2);
  assert.equal(june.minutes, 50);
  assert.equal(june.xp, 100);
  assert.equal(june.skills, 3);

  const may = r.find(m => m.key === '2026-05');
  assert.equal(may.sessions, 3);
  assert.equal(may.skills, 5);
});

test('empty months score 0 with a "No activity" label', () => {
  const r = monthlyReports(sessions, { now, months: 4 });
  const april = r.find(m => m.key === '2026-04');
  assert.equal(april.sessions, 0);
  assert.equal(april.score, 0);
  assert.equal(april.consistency, 'No activity');
});

test('active months get a 5–10 score', () => {
  const r = monthlyReports(sessions, { now, months: 4 });
  const june = r.find(m => m.key === '2026-06');
  assert.equal(june.score, 6); // 4 + 2 sessions
  assert.equal(june.consistency, 'Getting started');
});

test('handles empty/missing input safely', () => {
  assert.equal(monthlyReports([], { now, months: 2 }).length, 2);
  assert.equal(monthlyReports(undefined, { now, months: 2 }).length, 2);
});
