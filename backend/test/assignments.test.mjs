import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assigneeCount,
  playerCanSeeAssignment,
  serializeAssignment,
} from '../src/services/assignments.js';

test('playerCanSeeAssignment allows team-wide and self-targeted work', () => {
  assert.equal(playerCanSeeAssignment('all', 'p1'), true);
  assert.equal(playerCanSeeAssignment('p1', 'p1'), true);
  assert.equal(playerCanSeeAssignment('p2', 'p1'), false);
});

test('assigneeCount is the roster for team-wide work', () => {
  assert.equal(assigneeCount('all', 5), 5);
  assert.equal(assigneeCount('p1', 5), 1);
});

test('serializeAssignment reports player completion and progress', () => {
  const assignment = {
    id: 'a1',
    title: 'Wall passing',
    category: 'passing',
    dueDate: '2099-01-01',
    notes: 'Weaker foot',
    assignTo: 'all',
    createdAt: '2026-08-22',
  };
  const completions = [{ playerId: 'p1', player: { name: 'Alex' }, completedAt: '2026-08-22' }];

  const playerView = serializeAssignment(assignment, {
    rosterSize: 2,
    completions,
    playerId: 'p1',
  });
  assert.equal(playerView.completed, true);
  assert.equal(playerView.completedCount, 1);
  assert.equal(playerView.assigneeCount, 2);
  assert.equal(playerView.overdue, false);
  assert.equal(playerView.completions[0].name, 'Alex');

  const otherView = serializeAssignment(assignment, {
    rosterSize: 2,
    completions,
    playerId: 'p2',
  });
  assert.equal(otherView.completed, false);

  const coachView = serializeAssignment(assignment, { rosterSize: 2, completions });
  assert.equal(coachView.completed, false);
  assert.equal(coachView.completedCount, 1);
});

test('serializeAssignment marks overdue unfinished work', () => {
  const view = serializeAssignment(
    { id: 'a2', title: 'Sprints', category: 'speed', dueDate: '2020-01-01', assignTo: 'p1' },
    { rosterSize: 1, completions: [], playerId: 'p1' },
  );
  assert.equal(view.overdue, true);
  assert.equal(view.completed, false);
});
