import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml, difficultyBadge } from '../js/components/ui.js';
import { renderSessionExercises } from '../js/components/trainingSession.js';

const catalog = {
  speed: { id: 'speed', name: 'Speed & Athletic Performance' },
  passing: { id: 'passing', name: 'Passing' },
};

const helpers = { escapeHtml, difficultyBadge, categories: catalog };

test('session exercises show catalog category names, not the shortened map', () => {
  const html = renderSessionExercises([
    {
      id: 'sp_cod',
      category: 'speed',
      name: 'Change of Direction Sprints',
      duration: 10,
      reps: '5x T-test',
      difficulty: 'intermediate',
      xp: 40,
      description: 'Sprint, cut, and accelerate.',
    },
  ], helpers);
  assert.match(html, /Speed &amp; Athletic Performance/);
  assert.doesNotMatch(html, /Speed &amp; Athletic ·/);
  assert.match(html, /Change of Direction Sprints/);
  assert.match(html, /Equipment: None/);
});

test('session exercises escape names and descriptions', () => {
  const html = renderSessionExercises([
    {
      id: 'x1',
      category: 'passing',
      name: 'Wall <pass>',
      duration: 8,
      reps: '3x15',
      difficulty: 'beginner',
      xp: 25,
      description: 'Hit the <wall>.',
    },
  ], helpers);
  assert.match(html, /Wall &lt;pass&gt;/);
  assert.match(html, /Hit the &lt;wall&gt;/);
  assert.doesNotMatch(html, /Wall <pass>/);
});

test('session exercises title-case equipment and still escape it', () => {
  const html = renderSessionExercises([
    {
      id: 'pa_one_touch',
      category: 'passing',
      name: 'One-Touch Passing',
      duration: 8,
      reps: '3x15',
      difficulty: 'intermediate',
      xp: 40,
      equipment: ['ball', 'wall', 'agility ladder', 'cones<script>'],
      description: 'One-touch wall passes.',
    },
  ], helpers);
  assert.match(html, /Equipment: Ball, Wall, Agility Ladder, Cones&lt;script&gt;/);
  assert.doesNotMatch(html, /Equipment: ball, wall/);
  assert.doesNotMatch(html, /cones<script>/);
});

test('empty session shows rest-day copy instead of leftover drills', () => {
  const html = renderSessionExercises([], helpers);
  assert.match(html, /No exercises scheduled today/);
  assert.doesNotMatch(html, /exercise-item/);
});

test('completed drills are marked in the list', () => {
  const html = renderSessionExercises([
    { id: 'sp_cod', category: 'speed', name: 'Sprints', duration: 10, reps: '5x', difficulty: 'intermediate', xp: 40, description: 'Go.' },
  ], { ...helpers, completedIds: new Set(['sp_cod']) });
  assert.match(html, /exercise-item completed/);
  assert.match(html, />✓</);
});

test('training page loads category names from TrainingLab.getCatalog', () => {
  const html = readFileSync(new URL('../player/training.html', import.meta.url), 'utf8');
  assert.match(html, /TrainingLab\.getCatalog\(\)/);
  assert.match(html, /renderSessionExercises/);
  assert.match(html, /categories,/);
  assert.match(html, /import \{ renderNav, renderSidebar, difficultyBadge, escapeHtml \}/);
  assert.doesNotMatch(html, /getCategoryName/);
  assert.doesNotMatch(html, /from '\/js\/data\/exercises\.js'/);
});
