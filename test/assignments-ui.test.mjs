import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../js/components/ui.js';
import { renderCoachAssignmentList, renderPlayerAssignmentList } from '../js/components/assignments.js';

const names = { getCategoryName: (id) => id, escapeHtml };

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
