import test from 'node:test';
import assert from 'node:assert/strict';
import { formatProfileLabel } from '../js/components/ui.js';

test('formatProfileLabel title-cases stored profile tokens', () => {
  assert.equal(formatProfileLabel('midfielder'), 'Midfielder');
  assert.equal(formatProfileLabel('elite'), 'Elite');
  assert.equal(formatProfileLabel('intermediate'), 'Intermediate');
  assert.equal(formatProfileLabel('attacking_midfielder'), 'Attacking Midfielder');
  assert.equal(formatProfileLabel('centre-back'), 'Centre Back');
});

test('formatProfileLabel trims and ignores empty values', () => {
  assert.equal(formatProfileLabel('  goal keeper  '), 'Goal Keeper');
  assert.equal(formatProfileLabel(''), '');
  assert.equal(formatProfileLabel(null), '');
  assert.equal(formatProfileLabel(undefined), '');
});
