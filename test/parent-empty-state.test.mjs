import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../js/components/ui.js';
import { renderLinkPlayerCard, renderAchievementBadges, levelForXp, skillProgressionLabel } from '../js/components/parentChild.js';

test('empty parent state asks to link a player and does not invent stats', () => {
  const html = renderLinkPlayerCard({ escapeHtml });
  assert.match(html, /Link Player/);
  assert.match(html, /player@example.com/);
  assert.doesNotMatch(html, /1200/);
  assert.doesNotMatch(html, /8\/10/);
});

test('parent achievement badges map ids through the catalog and escape names', () => {
  const html = renderAchievementBadges(
    ['first_session', 'unknown_badge'],
    [{ id: 'first_session', name: 'First <Steps>', icon: '🎯' }],
    { escapeHtml },
  );
  assert.match(html, /First &lt;Steps&gt;/);
  assert.doesNotMatch(html, /First <Steps>/);
  assert.doesNotMatch(html, /unknown_badge/);
});

test('parent achievement badges show an empty state when none are unlocked', () => {
  const html = renderAchievementBadges([], [{ id: 'first_session', name: 'First Steps' }], { escapeHtml });
  assert.match(html, /No achievements yet/);
});

test('parent dashboard loads achievement names from TrainingLab.getCatalogAchievements', () => {
  const html = readFileSync(new URL('../parent/dashboard.html', import.meta.url), 'utf8');
  assert.match(html, /TrainingLab\.getCatalogAchievements\(\)/);
  assert.match(html, /renderAchievementBadges/);
  assert.doesNotMatch(html, /ACHIEVEMENTS\.find/);
});

const catalogLevels = [
  { id: 'rookie', name: 'Rookie', minXp: 0 },
  { id: 'academy', name: 'Academy', minXp: 500 },
  { id: 'advanced', name: 'Advanced', minXp: 1500 },
];

test('levelForXp uses catalog minXp thresholds instead of a hardcoded table', () => {
  assert.equal(levelForXp(catalogLevels, 1200).name, 'Academy');
  assert.equal(levelForXp(catalogLevels, 0).name, 'Rookie');
  assert.equal(levelForXp(catalogLevels, 1500).name, 'Advanced');
  assert.equal(levelForXp([], 1200).name, 'Rookie');
});

test('skillProgressionLabel formats the catalog level name and XP', () => {
  assert.equal(skillProgressionLabel(catalogLevels, 1200), 'Academy (1200 XP)');
  assert.equal(skillProgressionLabel([{ id: 'x', name: 'Elite <Pro>', minXp: 0 }], 99), 'Elite <Pro> (99 XP)');
});

test('parent dashboard loads skill progression from TrainingLab.getLevels', () => {
  const html = readFileSync(new URL('../parent/dashboard.html', import.meta.url), 'utf8');
  assert.match(html, /TrainingLab\.getLevels\(\)/);
  assert.match(html, /skillProgressionLabel\(levels,/);
  assert.doesNotMatch(html, /from '\/js\/data\/levels\.js'/);
  assert.doesNotMatch(html, /getLevelForXp/);
});
