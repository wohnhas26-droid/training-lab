import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAchievementId } from '../src/services/achievements.js';

const catalog = [{ id: 'speed_demon', name: 'Speed Demon' }];

test('validateAchievementId accepts a known id', () => {
  assert.equal(validateAchievementId('speed_demon', catalog), null);
});

test('validateAchievementId rejects missing and unknown ids', () => {
  assert.deepEqual(validateAchievementId('', catalog), {
    status: 400,
    error: 'Unknown achievement',
  });
  assert.deepEqual(validateAchievementId('not_a_real_badge', catalog), {
    status: 400,
    error: 'Unknown achievement',
  });
});
