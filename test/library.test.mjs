import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml, difficultyBadge } from '../js/components/ui.js';
import {
  normalizeCategories,
  categoryLabel,
  completedExerciseIds,
  filterExercises,
  renderCategoryOptions,
  renderLibraryCards,
} from '../js/components/library.js';

const helpers = { escapeHtml, difficultyBadge };

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
  assert.match(html, /Equipment: Ball/);
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

test('categoryLabel uses catalog names, not the shortened hardcoded map', () => {
  const catalog = {
    speed: { id: 'speed', name: 'Speed & Athletic Performance' },
    goalkeeper: { id: 'goalkeeper', name: 'Goalkeeper Training' },
    recovery: { id: 'recovery', name: 'Mobility & Recovery' },
  };
  assert.equal(categoryLabel('speed', catalog), 'Speed & Athletic Performance');
  assert.equal(categoryLabel('goalkeeper', catalog), 'Goalkeeper Training');
  assert.equal(categoryLabel('recovery', catalog), 'Mobility & Recovery');
  assert.equal(categoryLabel('ball_mastery', catalog), 'Ball Mastery');
});

test('library cards show catalog category names on drill subtitles', () => {
  const html = renderLibraryCards([
    {
      id: 'sp_cod',
      category: 'speed',
      name: 'Change of Direction Sprints',
      duration: 10,
      reps: '5x T-test',
      difficulty: 'intermediate',
      xp: 40,
      equipment: ['cones'],
      description: 'Sprint, cut, and accelerate.',
    },
  ], {
    escapeHtml,
    difficultyBadge,
    categories: { speed: { id: 'speed', name: 'Speed & Athletic Performance' } },
  });
  assert.match(html, /Speed &amp; Athletic Performance/);
  assert.doesNotMatch(html, /Speed &amp; Athletic ·/);
});

test('library cards without a catalog do not use the leftover shortened speed map', () => {
  const html = renderLibraryCards([
    {
      id: 'sp_cod',
      category: 'speed',
      name: 'Change of Direction Sprints',
      duration: 10,
      reps: '5x T-test',
      difficulty: 'intermediate',
      xp: 40,
      equipment: ['cones'],
      description: 'Sprint, cut, and accelerate.',
    },
  ], { escapeHtml, difficultyBadge });
  assert.match(html, /Speed ·/);
  assert.doesNotMatch(html, /Speed &amp; Athletic/);
});

test('shortened getCategoryName map is gone from ui and library cards', () => {
  const ui = readFileSync(new URL('../js/components/ui.js', import.meta.url), 'utf8');
  const library = readFileSync(new URL('../js/components/library.js', import.meta.url), 'utf8');
  assert.doesNotMatch(ui, /getCategoryName/);
  assert.doesNotMatch(ui, /Speed & Athletic'/);
  assert.doesNotMatch(library, /getCategoryName/);
});

test('library cards title-case equipment and still escape it', () => {
  const html = renderLibraryCards([
    {
      id: 'dr_1v1',
      category: 'dribbling',
      name: '1v1 Moves',
      duration: 10,
      reps: '5 attempts',
      difficulty: 'intermediate',
      xp: 45,
      equipment: ['ball', 'cones', 'agility ladder', 'wall<script>'],
      description: 'Practice feints.',
    },
  ], { escapeHtml, difficultyBadge });
  assert.match(html, /Equipment: Ball, Cones, Agility Ladder, Wall&lt;script&gt;/);
  assert.doesNotMatch(html, /Equipment: ball, cones/);
  assert.doesNotMatch(html, /wall<script>/);
});

test('library page passes catalog categories into drill cards', () => {
  const html = readFileSync(new URL('../player/library.html', import.meta.url), 'utf8');
  assert.match(html, /TrainingLab\.getCatalog\(\)/);
  assert.match(html, /categories = catalog\.categories/);
  assert.match(html, /completedIds, categories/);
  assert.doesNotMatch(html, /getCategoryName/);
});
