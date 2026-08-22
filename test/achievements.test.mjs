import test from 'node:test';
import assert from 'node:assert/strict';
import { pendingAchievements } from '../js/services/progressTracker.js';

function makeState(overrides = {}) {
  return {
    progress: { skillsCompleted: 0, streak: 0, xp: 0, ...(overrides.progress || {}) },
    completedExercises: overrides.completedExercises || [],
    achievements: overrides.achievements || [],
    challengeProgress: overrides.challengeProgress || {},
  };
}

test('pendingAchievements is empty when nothing is earned', () => {
  assert.deepEqual(pendingAchievements(makeState()), []);
});

test('pendingAchievements includes Speed Demon at 15 speed and skips already unlocked', () => {
  const pending = pendingAchievements(makeState({
    progress: { skillsCompleted: 42, streak: 5, xp: 1600 },
    achievements: ['first_session', 'streak_7'],
    challengeProgress: { speed: 15 },
  }));
  assert.deepEqual(pending.map((a) => a.id), ['speed_demon']);
});

test('pendingAchievements does not re-queue an already unlocked badge', () => {
  const pending = pendingAchievements(makeState({
    progress: { skillsCompleted: 42 },
    achievements: ['first_session'],
  }));
  assert.equal(pending.some((a) => a.id === 'first_session'), false);
});
