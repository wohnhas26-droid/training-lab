import test from 'node:test';
import assert from 'node:assert/strict';
import { formatProfileLabel, titleCasePhrase } from '../js/components/ui.js';

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

test('titleCasePhrase title-cases words and keeps hyphens and slashes', () => {
  assert.equal(titleCasePhrase('Toe taps'), 'Toe Taps');
  assert.equal(titleCasePhrase('Pull-push'), 'Pull-Push');
  assert.equal(titleCasePhrase('1v1 moves'), '1v1 Moves');
  assert.equal(titleCasePhrase('Inside/outside touches'), 'Inside/Outside Touches');
  assert.equal(titleCasePhrase('Cruyff turns'), 'Cruyff Turns');
  assert.equal(titleCasePhrase('Change of direction'), 'Change of Direction');
  assert.equal(titleCasePhrase('Speed and athletic performance'), 'Speed and Athletic Performance');
  assert.equal(titleCasePhrase('of direction'), 'Of Direction');
  assert.equal(titleCasePhrase(''), '');
  assert.equal(titleCasePhrase(null), '');
});
