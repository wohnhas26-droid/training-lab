import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../js/components/ui.js';
import { getCoachTeamData } from '../js/services/progressTracker.js';
import {
  coachTeamStats,
  renderCoachStats,
  renderCoachLeaderboardRows,
  renderCoachActivity,
  renderCoachLeaderboardPage,
  COACH_TEAM_LOAD_FAILED,
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

test('a failed roster load is not an empty team', () => {
  const board = renderCoachLeaderboardRows(null, { escapeHtml });
  const activity = renderCoachActivity(undefined, { escapeHtml });
  const page = renderCoachLeaderboardPage(null, { escapeHtml });
  assert.match(board, /Could not load your roster/);
  assert.match(activity, /Could not load your roster/);
  assert.match(page, /Could not load your roster/);
  assert.doesNotMatch(board, /No players on your roster yet/);
  assert.doesNotMatch(page, /No players on your roster yet/);
  assert.equal(COACH_TEAM_LOAD_FAILED.includes('Try again in a moment'), true);
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

test('leaderboard title-cases stored position tokens', () => {
  const rows = renderCoachLeaderboardRows([
    { id: 'p1', name: 'Alex', position: 'midfielder', xp: 1200, streak: 5, completion: 84 },
  ], { escapeHtml });
  assert.match(rows, /Midfielder/);
  assert.doesNotMatch(rows, />midfielder</);

  const page = renderCoachLeaderboardPage([
    { id: 'p1', name: 'Alex', position: 'attacking_midfielder', xp: 100, streak: 1, completion: 10 },
  ], { escapeHtml });
  assert.match(page, /Attacking Midfielder/);
  assert.doesNotMatch(page, /attacking_midfielder/);
});

test('coach team helpers return null when the API is up and the roster fetch fails', () => {
  const src = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.match(src, /return isApiMode\(\) \? null : emptyCoachTeamSnapshot\(\)/);
  assert.match(src, /return isApiMode\(\) \? null : getCoachTeamData\(\)/);
});

test('coach pages distinguish a failed roster load from no players', () => {
  const dashboard = readFileSync(new URL('../coach/dashboard.html', import.meta.url), 'utf8');
  const roster = readFileSync(new URL('../coach/players.html', import.meta.url), 'utf8');
  const assign = readFileSync(new URL('../coach/assign.html', import.meta.url), 'utf8');
  const feedback = readFileSync(new URL('../coach/feedback.html', import.meta.url), 'utf8');
  assert.match(dashboard, /if \(!snapshot\)/);
  assert.match(dashboard, /renderCoachTeamLoadFailed/);
  assert.match(roster, /if \(!Array\.isArray\(players\)\)/);
  assert.match(assign, /Could not load roster/);
  assert.match(feedback, /Could not load roster/);
});

test('coach roster and report pages format profile labels', () => {
  const roster = readFileSync(new URL('../coach/players.html', import.meta.url), 'utf8');
  assert.match(roster, /formatProfileLabel\(p\.position\)/);
  assert.doesNotMatch(roster, /escapeHtml\(p\.position\)/);

  const report = readFileSync(new URL('../coach/player.html', import.meta.url), 'utf8');
  assert.match(report, /formatProfileLabel\(detail\.profile\?\.position\)/);
  assert.match(report, /formatProfileLabel\(detail\.profile\?\.skillLevel\)/);
  assert.doesNotMatch(report, /detail\.profile\?\.position \|\| 'Player'/);
});
