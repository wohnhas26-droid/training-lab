import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail, validatePlayerForLink } from '../src/services/parentLinks.js';

test('normalizeEmail trims and lowercases', () => {
  assert.equal(normalizeEmail('  Player@TrainingLab.com '), 'player@traininglab.com');
});

test('validatePlayerForLink rejects missing, non-player, and self', () => {
  assert.deepEqual(validatePlayerForLink(null, 'p1'), {
    status: 404,
    error: 'No account found with that email',
  });
  assert.deepEqual(validatePlayerForLink({ id: 'c1', role: 'coach' }, 'p1'), {
    status: 400,
    error: 'That account is not a player',
  });
  assert.deepEqual(validatePlayerForLink({ id: 'p1', role: 'player' }, 'p1'), {
    status: 400,
    error: 'You cannot link your own account',
  });
  assert.equal(validatePlayerForLink({ id: 'kid', role: 'player' }, 'parent'), null);
});
