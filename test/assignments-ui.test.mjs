import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../js/components/ui.js';
import { renderCoachAssignmentList, renderPlayerAssignmentList, renderAssignPlayerOptions, renderAssignCategoryOptions } from '../js/components/assignments.js';

const names = { escapeHtml };

test('player list shows Mark complete until finished', () => {
  const html = renderPlayerAssignmentList([
    { id: 'a1', title: 'Wall <pass>', category: 'passing', dueDate: '2026-08-25', notes: 'Weaker foot', completed: false },
  ], names);
  assert.match(html, /Wall &lt;pass&gt;/);
  assert.match(html, /Mark complete/);
  assert.match(html, /data-id="a1"/);
});

test('player list shows Completed after finish', () => {
  const html = renderPlayerAssignmentList([
    { id: 'a1', title: 'Wall passing', category: 'passing', dueDate: '2026-08-25', completed: true },
  ], names);
  assert.match(html, /Completed/);
  assert.doesNotMatch(html, /Mark complete/);
});

test('coach list shows completion counts and notes', () => {
  const html = renderCoachAssignmentList([
    {
      id: 'a1',
      title: 'Sprints',
      category: 'speed',
      dueDate: '2026-08-25',
      notes: 'Stay low',
      assignTo: 'all',
      completedCount: 1,
      assigneeCount: 2,
      completed: false,
    },
  ], { ...names, assignToLabel: () => 'Entire Team' });
  assert.match(html, /1\/2 complete/);
  assert.match(html, /Stay low/);
  assert.match(html, /Entire Team/);
});

test('assign player options escape names and ids', () => {
  const html = renderAssignPlayerOptions([
    { id: 'p>"1', name: 'Alex <Rivera>' },
  ], { escapeHtml });
  assert.match(html, /Entire Team/);
  assert.match(html, /value="p&gt;&quot;1"/);
  assert.match(html, /Alex &lt;Rivera&gt;/);
  assert.doesNotMatch(html, /Alex <Rivera>/);
});

test('assign category options escape labels', () => {
  const html = renderAssignCategoryOptions({
    passing: { id: 'pass<ing>', name: 'Pass <ing>' },
  }, { escapeHtml });
  assert.match(html, /value="pass&lt;ing&gt;"/);
  assert.match(html, /Pass &lt;ing&gt;/);
});

test('assign category options accept an API category map', () => {
  const html = renderAssignCategoryOptions({
    ball_mastery: { id: 'ball_mastery', name: 'Ball Mastery' },
    passing: { id: 'passing', name: 'Passing' },
  }, { escapeHtml });
  assert.match(html, /value="ball_mastery"/);
  assert.match(html, /Ball Mastery/);
  assert.match(html, /value="passing"/);
});

test('assign page loads categories from TrainingLab.getCatalog', () => {
  const html = readFileSync(new URL('../coach/assign.html', import.meta.url), 'utf8');
  assert.match(html, /TrainingLab\.getCatalog\(\)/);
  assert.match(html, /renderAssignCategoryOptions\(catalog\.categories/);
  assert.doesNotMatch(html, /from '\/js\/data\/exercises\.js'/);
});

test('coach assignment list uses catalog names, not the shortened map', () => {
  const catalog = { speed: { id: 'speed', name: 'Speed & Athletic Performance' } };
  const html = renderCoachAssignmentList([
    {
      id: 'a1',
      title: 'COD sprints',
      category: 'speed',
      dueDate: '2026-08-25',
      assignTo: 'all',
      completedCount: 0,
      assigneeCount: 1,
    },
  ], {
    categories: catalog,
    escapeHtml,
    assignToLabel: () => 'Entire Team',
  });
  assert.match(html, /Speed &amp; Athletic Performance/);
  assert.doesNotMatch(html, /Speed &amp; Athletic ·/);
});

test('assign page wires assigned-session labels through catalog categories', () => {
  const html = readFileSync(new URL('../coach/assign.html', import.meta.url), 'utf8');
  assert.match(html, /categories = catalog\.categories/);
  assert.match(html, /renderCoachAssignmentList\(assignments, \{/);
  assert.match(html, /categories,/);
  assert.doesNotMatch(html, /getCategoryName/);
  assert.doesNotMatch(html, /categoryLabel/);
  assert.match(html, /import \{ renderNav, renderSidebar, escapeHtml \}/);
});

test('player assignment list uses catalog names, not the shortened map', () => {
  const catalog = { speed: { id: 'speed', name: 'Speed & Athletic Performance' } };
  const html = renderPlayerAssignmentList([
    {
      id: 'a1',
      title: 'COD sprint block',
      category: 'speed',
      dueDate: '2026-08-24',
      notes: 'T-test cuts',
      completed: false,
    },
  ], {
    categories: catalog,
    escapeHtml,
  });
  assert.match(html, /Speed &amp; Athletic Performance/);
  assert.doesNotMatch(html, /Speed &amp; Athletic ·/);
});

test('dashboard wires assignment labels through catalog categories and getCatalog', () => {
  const html = readFileSync(new URL('../player/dashboard.html', import.meta.url), 'utf8');
  assert.match(html, /TrainingLab\.getCatalog\(\)/);
  assert.match(html, /categories = catalog\.categories/);
  assert.match(html, /renderPlayerAssignmentList\(items, \{ categories, escapeHtml \}\)/);
  assert.match(html, /import \{ renderNav, renderSidebar, escapeHtml \}/);
  assert.doesNotMatch(html, /getCategoryName/);
  assert.doesNotMatch(html, /categoryLabel/);
  assert.doesNotMatch(html, /from '\/js\/data\/exercises\.js'/);
});

test('training page wires assignment labels through catalog categories', () => {
  const html = readFileSync(new URL('../player/training.html', import.meta.url), 'utf8');
  assert.match(html, /TrainingLab\.getCatalog\(\)/);
  assert.match(html, /renderPlayerAssignmentList\(items, \{ categories, escapeHtml \}\)/);
  assert.doesNotMatch(html, /getCategoryName/);
});

test('assignment lists label categories through categoryLabel, not getCategoryName', () => {
  const src = readFileSync(new URL('../js/components/assignments.js', import.meta.url), 'utf8');
  assert.match(src, /import \{ categoryLabel \} from '\.\/library\.js'/);
  assert.match(src, /categoryLabel\(a\.category, categories\)/);
  assert.doesNotMatch(src, /getCategoryName/);
});
