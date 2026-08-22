import test from 'node:test';
import assert from 'node:assert/strict';
import { applyChallengeProgress, challengeCardStatus } from '../src/services/challenges.js';

test('caps progress at the target and flags first completion', () => {
  const result = applyChallengeProgress({ progress: 18, completed: false }, 5, 20);
  assert.deepEqual(result, { progress: 20, completed: true, newlyCompleted: true });
});

test('already completed enrollments do not advance or re-complete', () => {
  const result = applyChallengeProgress({ progress: 20, completed: true }, 3, 20);
  assert.deepEqual(result, { progress: 20, completed: true, newlyCompleted: false });
});

test('defaults a missing increment to 1', () => {
  const result = applyChallengeProgress({ progress: 4, completed: false }, undefined, 10);
  assert.equal(result.progress, 5);
  assert.equal(result.completed, false);
});

test('challengeCardStatus covers available, active, and completed', () => {
  assert.equal(challengeCardStatus({ joined: false, completed: false, progress: 0, targetCount: 10 }), 'available');
  assert.equal(challengeCardStatus({ joined: true, completed: false, progress: 3, targetCount: 10 }), 'active');
  assert.equal(challengeCardStatus({ joined: false, completed: true, progress: 10, targetCount: 10 }), 'completed');
  assert.equal(challengeCardStatus({ joined: true, completed: false, progress: 10, targetCount: 10 }), 'completed');
});
