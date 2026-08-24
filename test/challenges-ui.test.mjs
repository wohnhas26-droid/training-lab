import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../js/components/ui.js';
import {
  challengeCardStatus,
  hydrateChallenges,
  renderChallengeCards,
} from '../js/components/challenges.js';

const helpers = { escapeHtml };

test('challengeCardStatus covers available, active, and completed', () => {
  assert.equal(challengeCardStatus({ joined: false, completed: false, progress: 0, targetCount: 10 }), 'available');
  assert.equal(challengeCardStatus({ joined: true, completed: false, progress: 3, targetCount: 10 }), 'active');
  assert.equal(challengeCardStatus({ joined: false, completed: true, progress: 10, targetCount: 10 }), 'completed');
  assert.equal(challengeCardStatus({ joined: true, completed: false, progress: 10, targetCount: 10 }), 'completed');
});

test('hydrateChallenges uses API joined/completed/progress when no local state', () => {
  const list = hydrateChallenges([
    { id: 'speed', name: 'Speed', targetCount: 15, progress: 15, joined: true, completed: true },
    { id: 'weak_foot', name: 'Weak Foot', targetCount: 20, progress: 13, joined: true, completed: false },
  ]);
  assert.equal(list[0].completed, true);
  assert.equal(list[1].progress, 13);
  assert.equal(list[1].joined, true);
});

test('hydrateChallenges derives status from local player state when offline', () => {
  const list = hydrateChallenges(
    [{ id: 'speed', name: 'Speed', targetCount: 15 }, { id: 'weak_foot', name: 'Weak Foot', targetCount: 20 }],
    {
      activeChallenges: ['weak_foot'],
      completedChallenges: ['speed'],
      challengeProgress: { speed: 15, weak_foot: 13 },
    },
  );
  assert.equal(list[0].completed, true);
  assert.equal(list[0].joined, true);
  assert.equal(list[1].joined, true);
  assert.equal(list[1].completed, false);
  assert.equal(list[1].progress, 13);
});

test('renderChallengeCards escapes names and shows API progress', () => {
  const html = renderChallengeCards([
    {
      id: 'weak_foot',
      name: 'Weak <Foot>',
      description: 'Do 20 <drills>',
      icon: '🦶',
      xpReward: 400,
      duration: 14,
      targetCount: 20,
      unit: 'drills',
      progress: 13,
      joined: true,
      completed: false,
    },
  ], helpers);
  assert.match(html, /Weak &lt;Foot&gt;/);
  assert.match(html, /Do 20 &lt;drills&gt;/);
  assert.match(html, /13\/20 drills/);
  assert.match(html, /Log Progress/);
  assert.doesNotMatch(html, /Weak <Foot>/);
});

test('empty challenge list shows an empty state instead of leftover cards', () => {
  const html = renderChallengeCards([], helpers);
  assert.match(html, /No challenges available/);
  assert.doesNotMatch(html, /Join Challenge/);
});

test('completed cards hide Join and Log Progress', () => {
  const html = renderChallengeCards([
    {
      id: 'speed',
      name: 'Speed',
      description: 'Sprints',
      icon: '⚡',
      xpReward: 400,
      duration: 21,
      targetCount: 15,
      unit: 'sessions',
      progress: 15,
      joined: true,
      completed: true,
    },
  ], helpers);
  assert.match(html, /Completed/);
  assert.doesNotMatch(html, /Join Challenge/);
  assert.doesNotMatch(html, /Log Progress/);
});
