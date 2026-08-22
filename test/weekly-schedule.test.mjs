import test from 'node:test';
import assert from 'node:assert/strict';
import { daysFromWeeklyPlan } from '../js/utils/weeklySchedule.js';

const fallback = {
  monday: { focus: ['Ball Mastery'] },
  saturday: { focus: ['Match Preparation'] },
};

test('daysFromWeeklyPlan uses the personalized plan including rest days', () => {
  const days = daysFromWeeklyPlan({
    plan: {
      monday: { focus: ['Passing'], rest: false },
      saturday: { rest: true, exercises: [] },
    },
  }, fallback);
  assert.deepEqual(days.find((d) => d.day === 'monday'), {
    day: 'monday',
    rest: false,
    focus: ['Passing'],
    estimatedMinutes: 0,
  });
  assert.equal(days.find((d) => d.day === 'saturday').rest, true);
  assert.deepEqual(days.find((d) => d.day === 'saturday').focus, ['Rest']);
});

test('daysFromWeeklyPlan falls back when no plan is stored', () => {
  const days = daysFromWeeklyPlan(null, fallback);
  assert.equal(days.find((d) => d.day === 'saturday').rest, false);
  assert.deepEqual(days.find((d) => d.day === 'saturday').focus, ['Match Preparation']);
});
