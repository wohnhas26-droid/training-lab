import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../js/components/ui.js';
import {
  listHomeCategories,
  subcategoryPreview,
  renderHomeCategoryCards,
} from '../js/components/homeCategories.js';

test('listHomeCategories accepts API objects and arrays', () => {
  assert.equal(listHomeCategories({
    ball_mastery: { id: 'ball_mastery', name: 'Ball Mastery', icon: '⚽' },
  })[0].name, 'Ball Mastery');
  assert.equal(listHomeCategories([{ id: 'passing', name: 'Passing' }])[0].id, 'passing');
  assert.deepEqual(listHomeCategories(null), []);
});

test('subcategoryPreview takes the first four drill names', () => {
  assert.deepEqual(subcategoryPreview({
    subcategories: { foundations: ['Toe taps', 'Pull-push', 'V-cuts', 'L-turns', 'Cruyff turns'] },
  }), ['Toe taps', 'Pull-push', 'V-cuts', 'L-turns']);
});

test('home category cards escape names and drill previews', () => {
  const html = renderHomeCategoryCards({
    ball_mastery: {
      id: 'ball_mastery',
      name: 'Ball <Mastery>',
      icon: '⚽',
      subcategories: { foundations: ['Toe <taps>', 'Pull-push', 'V-cuts', 'L-turns'] },
    },
  }, { escapeHtml });
  assert.match(html, /Ball &lt;Mastery&gt;/);
  assert.match(html, /Toe &lt;taps&gt;/);
  assert.doesNotMatch(html, /Ball <Mastery>/);
  assert.doesNotMatch(html, /Toe <taps>/);
});

test('home category cards title-case drill previews to match library names', () => {
  const html = renderHomeCategoryCards({
    ball_mastery: {
      id: 'ball_mastery',
      name: 'Ball Mastery',
      icon: '⚽',
      subcategories: { foundations: ['Toe taps', 'Pull-push', 'V-cuts', 'L-turns', 'Cruyff turns'] },
    },
    dribbling: {
      id: 'dribbling',
      name: 'Dribbling',
      icon: '🏃',
      subcategories: { moves: ['1v1 moves', 'Change of direction'] },
    },
  }, { escapeHtml });
  assert.match(html, /Toe Taps · Pull-Push · V-Cuts · L-Turns/);
  assert.match(html, /1v1 Moves · Change Of Direction/);
  assert.doesNotMatch(html, /Toe taps/);
  assert.doesNotMatch(html, /Pull-push/);
  assert.doesNotMatch(html, /1v1 moves/);
});

test('empty catalog shows a loading empty state instead of leftover cards', () => {
  const html = renderHomeCategoryCards({}, { escapeHtml });
  assert.match(html, /Training categories will appear/);
  assert.doesNotMatch(html, /Ball Mastery/);
});

test('homepage loads categories from TrainingLab.getCatalog', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /TrainingLab\.getCatalog\(\)/);
  assert.match(html, /renderHomeCategoryCards\(catalog\.categories/);
  assert.doesNotMatch(html, /from '\/js\/data\/exercises\.js'/);
});

test('homepage How It Works copy does not claim an AI plan', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /We build your personalized plan from that profile/);
  assert.doesNotMatch(html, /Our AI builds your personalized plan/);
});
