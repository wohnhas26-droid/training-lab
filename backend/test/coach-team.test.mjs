import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatLastActive,
  serializeTeamPlayer,
  computeTeamStats,
  buildTeamActivity,
} from '../src/services/coachTeam.js';

const NOW = new Date('2026-08-22T18:00:00.000Z');

test('formatLastActive is honest about missing and older dates', () => {
  assert.equal(formatLastActive(null, NOW), 'Never');
  assert.equal(formatLastActive('', NOW), 'Never');
  assert.equal(formatLastActive('2026-08-22', NOW), 'Today');
  assert.equal(formatLastActive('2026-08-21', NOW), 'Yesterday');
  assert.equal(formatLastActive('2026-08-19', NOW), '3 days ago');
  assert.equal(formatLastActive('2026-07-01', NOW), '2026-07-01');
});

test('empty roster stats are zeros, not NaN', () => {
  assert.deepEqual(computeTeamStats([]), {
    playerCount: 0,
    activeToday: 0,
    avgCompletion: 0,
    topStreak: 0,
  });
  assert.equal(Number.isNaN(computeTeamStats([]).avgCompletion), false);
});

test('top streak is the max, not the first player', () => {
  const stats = computeTeamStats([
    { completion: 40, streak: 2, lastActive: 'Recently' },
    { completion: 80, streak: 9, lastActive: 'Today' },
    { completion: 60, streak: 4, lastActive: 'Today' },
  ]);
  assert.equal(stats.playerCount, 3);
  assert.equal(stats.activeToday, 2);
  assert.equal(stats.avgCompletion, 60);
  assert.equal(stats.topStreak, 9);
});

test('serializeTeamPlayer uses Never when there is no last training date', () => {
  const player = serializeTeamPlayer({
    user: {
      id: 'p1',
      name: 'Alex',
      profile: { position: 'midfielder' },
      progress: { xp: 100, streak: 1, skillsCompleted: 10 },
    },
  }, NOW);
  assert.equal(player.lastActive, 'Never');
  assert.equal(player.lastTrainingDate, null);
  assert.equal(player.completion, 20);
});

test('activity only includes real sessions, videos, and assignment completions', () => {
  const items = buildTeamActivity({
    sessions: [{
      id: 's1',
      userId: 'p1',
      date: '2026-08-22',
      createdAt: new Date('2026-08-22T12:00:00.000Z'),
      user: { id: 'p1', name: 'Alex Rivera' },
    }],
    videos: [{
      id: 'v1',
      playerId: 'p1',
      skill: 'First Touch',
      createdAt: new Date('2026-08-22T15:00:00.000Z'),
      player: { id: 'p1', name: 'Alex Rivera' },
    }],
    completions: [{
      id: 'c1',
      playerId: 'p1',
      completedAt: new Date('2026-08-21T10:00:00.000Z'),
      player: { id: 'p1', name: 'Alex Rivera' },
      assignment: { title: 'Weaker-foot wall passing' },
    }],
  }, NOW);

  assert.equal(items.length, 3);
  assert.equal(items[0].type, 'video');
  assert.match(items[0].text, /First Touch/);
  assert.equal(items[1].type, 'session');
  assert.match(items[1].text, /completed training/);
  assert.equal(items[2].type, 'assignment');
  assert.match(items[2].text, /Weaker-foot wall passing/);
  assert.deepEqual(buildTeamActivity({}, NOW), []);
});
