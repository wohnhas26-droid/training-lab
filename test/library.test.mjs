import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, getCategoryName, difficultyBadge } from '../js/components/ui.js';
import {
  normalizeCategories,
  completedExerciseIds,
  filterExercises,
  renderCategoryOptions,
  renderLibraryCards,
} from '../js/components/library.js';

const helpers = { escapeHtml, getCategoryName, difficultyBadge };

test('normalizeCategories accepts API objects and arrays', () => {
  assert.deepEqual(normalizeCategories({
    ball_mastery: { id: 'ball_mastery', name: 'Ball Mastery' },
  }), [{ id: 'ball_mastery', name: 'Ball Mastery' }]);
  assert.deepEqual(normalizeCategories([{ id: 'passing', name: 'Passing' }]), [
    { id: 'passing', name: 'Passing' },
  ]);
  assert.deepEqual(normalizeCategories(null), []);
});

test('completedExerciseIds unions table rows and session exercise lists', () => {
  const ids = completedExerciseIds({
    completedExercises: ['bm_toe_taps'],
    completedSessions: [
      { date: '2026-08-22', exercises: ['pa_two_touch', 'bm_toe_taps'] },
    ],
  });
  assert.equal(ids.has('bm_toe_taps'), true);
  assert.equal(ids.has('pa_two_touch'), true);
  assert.equal(ids.has('fi_volleys'), false);
});

test('library cards escape names and mark completed drills', () => {
  const html = renderLibraryCards([
    {
      id: 'bm_toe_taps',
      category: 'ball_mastery',
      name: 'Toe <Taps>',
      duration: 3,
      reps: '60 sec',
      difficulty: 'beginner',
      xp: 25,
      equipment: ['ball'],
      description: 'Quick <toe> taps.',
    },
  ], { ...helpers, completedIds: new Set(['bm_toe_taps']) });
  assert.match(html, /Toe &lt;Taps&gt;/);
  assert.match(html, /Quick &lt;toe&gt; taps/);
  assert.match(html, /Completed/);
  assert.match(html, /Ball Mastery/);
});

test('empty category filter shows an empty state instead of leftover cards', () => {
  const html = renderLibraryCards(filterExercises([
    { id: 'bm_toe_taps', category: 'ball_mastery', name: 'Toe Taps' },
  ], 'goalkeeper'), helpers);
  assert.match(html, /No exercises in this category/);
  assert.doesNotMatch(html, /Toe Taps/);
});

test('category options include All and escape labels', () => {
  const html = renderCategoryOptions([{ id: 'passing', name: 'Pass <ing>' }], { escapeHtml });
  assert.match(html, /value="all"/);
  assert.match(html, /Pass &lt;ing&gt;/);
});
