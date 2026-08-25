import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCategoryLabel, formatFocusAreas, generateEvaluation, generatePersonalizedPlan, toCategoryId, focusListToCsv, csvToCategoryIds } from '../js/services/trainingPlanner.js';

test('formatCategoryLabel maps catalog ids and title-cases phrases', () => {
  assert.equal(formatCategoryLabel('ball_mastery'), 'Ball Mastery');
  assert.equal(formatCategoryLabel('first touch'), 'First Touch');
  assert.equal(formatCategoryLabel(''), '');
});

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

test('generateEvaluation recommendation title-cases skill level and position', () => {
  const evaluation = generateEvaluation(
    { skillLevel: 'elite', position: 'midfielder', improvementAreas: ['passing'] },
    { skillsCompleted: 42, streak: 5 },
  );
  assert.match(evaluation.recommendation, /Based on your Elite level and Midfielder position/);
  assert.doesNotMatch(evaluation.recommendation, /elite level/);
  assert.doesNotMatch(evaluation.recommendation, /midfielder position/);
});

test('toCategoryId maps catalog names and phrases back to ids', () => {
  assert.equal(toCategoryId('ball_mastery'), 'ball_mastery');
  assert.equal(toCategoryId('Ball Mastery'), 'ball_mastery');
  assert.equal(toCategoryId('first touch'), 'first_touch');
  assert.equal(toCategoryId('Passing'), 'passing');
});

test('focus list CSV round-trips stored ids through display names', () => {
  assert.equal(focusListToCsv(['ball_mastery', 'passing']), 'Ball Mastery, Passing');
  assert.deepEqual(csvToCategoryIds('Ball Mastery, Passing'), ['ball_mastery', 'passing']);
  assert.deepEqual(csvToCategoryIds('ball_mastery, passing'), ['ball_mastery', 'passing']);
});

test('personalized plan maps improvement phrases to catalog category ids', () => {
  const plan = generatePersonalizedPlan({
    improvementAreas: ['ball mastery', 'first touch'],
    equipment: ['ball'],
  });
  const cats = Object.values(plan.plan).flatMap((day) => day.categories || []);
  assert.equal(cats.includes('ball_mastery'), true);
  assert.equal(cats.includes('first_touch'), true);
  assert.equal(cats.includes('ball mastery'), false);
  assert.equal(cats.includes('first touch'), false);
});
