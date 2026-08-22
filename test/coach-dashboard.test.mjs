import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../js/components/ui.js';
import { getCoachTeamData } from '../js/services/progressTracker.js';
import {
  coachTeamStats,
  renderCoachStats,
  renderCoachLeaderboardRows,
  renderCoachActivity,
  renderCoachLeaderboardPage,
} from '../js/components/coachDashboard.js';

test('offline roster is empty and does not invent teammates', () => {
  const players = getCoachTeamData();
  assert.deepEqual(players, []);
  assert.doesNotMatch(JSON.stringify(players), /Jordan Lee/);
});

test('empty stats render 0% instead of NaN', () => {
  const stats = coachTeamStats([]);
  assert.equal(stats.avgCompletion, 0);
  assert.equal(Number.isNaN(stats.avgCompletion), false);
  const html = renderCoachStats(stats);
  assert.match(html, />0%<\/div>/);
  assert.doesNotMatch(html, /NaN/);
});

test('empty leaderboard and activity do not invent completed training', () => {
  const board = renderCoachLeaderboardRows([], { escapeHtml });
  const activity = renderCoachActivity([], { escapeHtml });
  const page = renderCoachLeaderboardPage([], { escapeHtml });
  assert.match(board, /No players on your roster yet/);
  assert.match(page, /No players on your roster yet/);
  assert.match(activity, /No recent team activity yet/);
  assert.doesNotMatch(activity, /completed training/);
  assert.doesNotMatch(board, /Jordan Lee/);
});

test('roster and activity link to the player detail page and escape names', () => {
  const rows = renderCoachLeaderboardRows([
    { id: 'p1', name: 'Alex <Rivera>', position: 'midfielder', xp: 1200, streak: 5, completion: 84 },
  ], { escapeHtml });
  assert.match(rows, /\/coach\/player\.html\?id=p1/);
  assert.match(rows, /Alex &lt;Rivera&gt;/);

  const activity = renderCoachActivity([
    { playerId: 'p1', playerName: 'Alex', text: 'Alex completed <drill>', when: 'Today' },
  ], { escapeHtml });
  assert.match(activity, /\/coach\/player\.html\?id=p1/);
  assert.match(activity, /Alex completed &lt;drill&gt;/);
});
