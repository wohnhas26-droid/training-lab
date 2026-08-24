import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFocusAreas, generateEvaluation } from '../js/services/trainingPlanner.js';

test('formatFocusAreas maps catalog ids to display names', () => {
  assert.equal(formatFocusAreas(['ball_mastery', 'passing']), 'Ball Mastery, Passing');
  assert.equal(formatFocusAreas(['first_touch']), 'First Touch');
});

test('formatFocusAreas title-cases unknown ids and human phrases', () => {
  assert.equal(formatFocusAreas(['weak foot']), 'Weak Foot');
  assert.equal(formatFocusAreas(null), 'Ball Mastery');
  assert.equal(formatFocusAreas([]), 'Ball Mastery');
});

test('generateEvaluation recommendation uses catalog names, not snake_case ids', () => {
  const evaluation = generateEvaluation(
    { skillLevel: 'elite', position: 'midfielder', improvementAreas: ['ball_mastery', 'passing'] },
    { skillsCompleted: 42, streak: 5 },
  );
  assert.match(evaluation.recommendation, /Ball Mastery, Passing/);
  assert.doesNotMatch(evaluation.recommendation, /ball_mastery/);
});
