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
