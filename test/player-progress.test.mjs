import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../js/components/ui.js';
import {
  renderDashboardStats,
  renderLevelInfo,
  renderProgressStats,
  renderLevelTrack,
  renderAchievements,
  renderEvaluation,
  isRestSession,
  renderSessionCta,
} from '../js/components/playerProgress.js';

const apiSummary = {
  xp: 1600,
  streak: 5,
  minutesTrained: 340,
  skillsCompleted: 42,
  achievementsUnlocked: 2,
  totalAchievements: 10,
  weeklySessions: 2,
  level: { name: 'Advanced', icon: '🔥' },
  nextLevel: { name: 'Elite' },
  levelProgress: 10,
};

test('dashboard stats use the API summary instead of leftover zeros', () => {
  const html = renderDashboardStats(apiSummary);
  assert.match(html, />1600<\/div>/);
  assert.match(html, />5<\/div>/);
  assert.match(html, />340<\/div>/);
  assert.match(html, />2\/10<\/div>/);
  assert.doesNotMatch(html, />0<\/div><div class="stat-label">Total XP/);
});

test('empty summary is zeros, not NaN', () => {
  const html = renderDashboardStats({});
  assert.match(html, />0<\/div><div class="stat-label">Total XP/);
  assert.doesNotMatch(html, /NaN/);
});

test('level info uses API level name and progress', () => {
  const html = renderLevelInfo(apiSummary);
  assert.match(html, /Advanced/);
  assert.match(html, /10% to Elite/);
});

test('progress stats show weekly sessions from the summary', () => {
  const html = renderProgressStats(apiSummary);
  assert.match(html, />42<\/div>/);
  assert.match(html, />2<\/div><div class="stat-label">Sessions This Week/);
});

test('level track unlocks from API xp and escapes names', () => {
  const html = renderLevelTrack([
    { id: 'rookie', name: 'Rookie <1>', minXp: 0, icon: '🌱' },
    { id: 'elite', name: 'Elite', minXp: 3500, icon: '⭐' },
  ], 1600, { escapeHtml });
  assert.match(html, /Rookie &lt;1&gt;/);
  assert.match(html, /Unlocked/);
  assert.match(html, /Elite/);
});

test('achievements mark only unlocked ids', () => {
  const html = renderAchievements([
    { id: 'first_session', name: 'First Steps', description: 'Go', icon: '🎯' },
    { id: 'speed_demon', name: 'Speed Demon', description: 'Fast', icon: '⚡' },
  ], ['first_session'], { escapeHtml });
  assert.match(html, /achievement unlocked/);
  assert.match(html, /First Steps/);
  assert.match(html, /Speed Demon/);
});

test('achievements from the API catalog still escape names', () => {
  const html = renderAchievements([
    { id: 'first_session', name: 'First <Steps>', description: 'Complete <session>', icon: '🎯' },
  ], ['first_session'], { escapeHtml });
  assert.match(html, /First &lt;Steps&gt;/);
  assert.match(html, /Complete &lt;session&gt;/);
  assert.doesNotMatch(html, /First <Steps>/);
});

test('evaluation render escapes recommendation and list items', () => {
  const html = renderEvaluation({
    overallRating: 8,
    recommendation: 'Focus on <finishing>',
    strengths: ['Good <touch>'],
    improvements: ['Work on <weak foot>'],
  }, { escapeHtml });
  assert.match(html, /8\/10/);
  assert.match(html, /Focus on &lt;finishing&gt;/);
  assert.match(html, /Good &lt;touch&gt;/);
  assert.match(html, /Work on &lt;weak foot&gt;/);
  assert.doesNotMatch(html, /<finishing>/);
});

test('missing evaluation renders nothing', () => {
  assert.equal(renderEvaluation(null, { escapeHtml }), '');
});

test('progress page loads the level track from TrainingLab.getLevels', () => {
  const html = readFileSync(new URL('../player/progress.html', import.meta.url), 'utf8');
  assert.match(html, /TrainingLab\.getLevels\(\)/);
  assert.match(html, /renderLevelTrack\(levels,/);
  assert.doesNotMatch(html, /from '\/js\/data\/levels\.js'/);
});

test('rest sessions include planner rest days even when recovery drills exist', () => {
  assert.equal(isRestSession({ rest: true, exercises: [{ id: 'mobility' }] }), true);
  assert.equal(isRestSession({ rest: true, exercises: [] }), true);
  assert.equal(isRestSession({ rest: false, exercises: [] }), true);
  assert.equal(isRestSession({ rest: false, exercises: [{ id: 'passing' }] }), false);
  assert.equal(isRestSession(null), false);
});

test('dashboard CTA is secondary View rest day on rest, primary Start Session otherwise', () => {
  const rest = renderSessionCta({ rest: true, exercises: [{ id: 'mobility' }] });
  assert.match(rest, /View rest day/);
  assert.match(rest, /btn-secondary/);
  assert.match(rest, /href="\/player\/training\.html"/);
  assert.doesNotMatch(rest, /Start Session/);

  const training = renderSessionCta({ rest: false, exercises: [{ id: 'passing' }] });
  assert.match(training, /Start Session/);
  assert.match(training, /btn-primary/);
  assert.doesNotMatch(training, /View rest day/);

  const missing = renderSessionCta(null);
  assert.match(missing, /Start Session/);
});

test('dashboard wires Today\'s Training CTA through renderSessionCta', () => {
  const html = readFileSync(new URL('../player/dashboard.html', import.meta.url), 'utf8');
  assert.match(html, /id="session-cta"/);
  assert.match(html, /renderSessionCta\(session\)/);
  assert.doesNotMatch(html, />Start Session<\/a>/);
});
