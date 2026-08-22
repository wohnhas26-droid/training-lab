import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../js/components/ui.js';
import {
  renderDashboardStats,
  renderLevelInfo,
  renderProgressStats,
  renderLevelTrack,
  renderAchievements,
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
