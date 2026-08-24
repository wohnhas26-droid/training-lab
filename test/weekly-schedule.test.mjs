import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../js/components/ui.js';
import { daysFromWeeklyPlan, renderWeeklySchedule } from '../js/utils/weeklySchedule.js';

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

test('daysFromWeeklyPlan is empty without a plan or fallback', () => {
  assert.deepEqual(daysFromWeeklyPlan(null), []);
  assert.deepEqual(daysFromWeeklyPlan({}), []);
});

test('renderWeeklySchedule shows rest from the personalized plan, not Match Preparation', () => {
  const days = daysFromWeeklyPlan({
    plan: {
      friday: { focus: ['Position-Specific Training'], rest: false },
      saturday: { rest: true, exercises: [] },
    },
  });
  const html = renderWeeklySchedule(days, 'friday', { escapeHtml });
  assert.match(html, /Friday/);
  assert.match(html, /Position-Specific Training/);
  assert.match(html, /Saturday/);
  assert.match(html, />Rest</);
  assert.doesNotMatch(html, /Match Preparation/);
  assert.match(html, /day-card today/);
});

test('renderWeeklySchedule empty state when there is no plan', () => {
  const html = renderWeeklySchedule([], 'monday', { escapeHtml });
  assert.match(html, /No weekly plan yet/);
  assert.doesNotMatch(html, /day-card/);
});

test('renderWeeklySchedule escapes day labels and focus copy', () => {
  const html = renderWeeklySchedule([
    { day: 'monday<script>', rest: false, focus: ['Passing <fast>'] },
  ], 'tuesday', { escapeHtml });
  assert.match(html, /Passing &lt;fast&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /Passing <fast>/);
});

test('dashboard weekly schedule uses the personalized plan without the bundled WEEKLY_SCHEDULE', () => {
  const html = readFileSync(new URL('../player/dashboard.html', import.meta.url), 'utf8');
  assert.match(html, /daysFromWeeklyPlan\(weeklyPlan\)/);
  assert.match(html, /renderWeeklySchedule\(days, today/);
  assert.doesNotMatch(html, /WEEKLY_SCHEDULE/);
  assert.doesNotMatch(html, /from '\/js\/data\/exercises\.js'/);
});
