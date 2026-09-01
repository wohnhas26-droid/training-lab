import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  plansForRole,
  defaultPlanForRole,
  roleForPlan,
  selectedPlanForRole,
  planOptionLabel,
  pricingPlansForUser,
  planAllowedForRole,
  SUBSCRIPTION_PLANS,
} from '../js/data/subscriptions.js';

test('player and parent see player and elite, not team', () => {
  assert.deepEqual(plansForRole('player').map((p) => p.id), ['player', 'elite']);
  assert.deepEqual(plansForRole('parent').map((p) => p.id), ['player', 'elite']);
  assert.equal(defaultPlanForRole('player'), 'player');
  assert.equal(defaultPlanForRole('parent'), 'player');
});

test('coach sees only the team plan', () => {
  assert.deepEqual(plansForRole('coach').map((p) => p.id), ['team']);
  assert.equal(defaultPlanForRole('coach'), 'team');
});

test('selectedPlanForRole keeps a valid preferred plan and otherwise defaults', () => {
  assert.equal(selectedPlanForRole('player', 'elite'), 'elite');
  assert.equal(selectedPlanForRole('player', 'team'), 'player');
  assert.equal(selectedPlanForRole('coach', 'player'), 'team');
  assert.equal(selectedPlanForRole('coach', 'team'), 'team');
});

test('team pricing deeplink maps to the coach role', () => {
  assert.equal(roleForPlan('team'), 'coach');
  assert.equal(roleForPlan('player'), null);
  assert.equal(roleForPlan('elite'), null);
});

test('plan option labels match the onboarding copy', () => {
  const byId = Object.fromEntries(SUBSCRIPTION_PLANS.map((p) => [p.id, p]));
  assert.equal(planOptionLabel(byId.player), 'Player — $29.99/mo');
  assert.equal(planOptionLabel(byId.elite), 'Elite — $59.99/mo');
  assert.equal(planOptionLabel(byId.team), 'Team — $199/mo');
});

test('onboarding rewrites plan options from role', () => {
  const html = readFileSync(new URL('../onboarding.html', import.meta.url), 'utf8');
  assert.match(html, /plansForRole/);
  assert.match(html, /selectedPlanForRole/);
  assert.match(html, /roleForPlan/);
  assert.match(html, /applyRoleAndPlans/);
});

test('logged-out pricing shows every plan and logged-in pricing follows role', () => {
  assert.deepEqual(pricingPlansForUser(null).map((p) => p.id), ['player', 'elite', 'team']);
  assert.deepEqual(pricingPlansForUser('coach').map((p) => p.id), ['team']);
  assert.deepEqual(pricingPlansForUser('player').map((p) => p.id), ['player', 'elite']);
  assert.deepEqual(pricingPlansForUser('parent').map((p) => p.id), ['player', 'elite']);
  assert.equal(planAllowedForRole('coach', 'player'), false);
  assert.equal(planAllowedForRole('coach', 'team'), true);
  assert.equal(planAllowedForRole('parent', 'elite'), true);
  assert.equal(planAllowedForRole('parent', 'team'), false);
  assert.equal(planAllowedForRole(null, 'team'), false);
});
