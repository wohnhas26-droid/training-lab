import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasSavedUser, savedUserRole } from '../js/components/ui.js';
import { pricingPlanAction, ALREADY_ON_PLAN, SWITCH_VIA_BILLING } from '../js/data/subscriptions.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function mockStorage(raw) {
  globalThis.localStorage = {
    getItem: () => raw,
  };
}

test('hasSavedUser is false without a user even if other state exists', () => {
  mockStorage(null);
  assert.equal(hasSavedUser(), false);
  mockStorage(JSON.stringify({ user: null }));
  assert.equal(hasSavedUser(), false);
});

test('hasSavedUser is true when a user object is saved', () => {
  mockStorage(JSON.stringify({ user: { name: 'Alex', role: 'player' } }));
  assert.equal(hasSavedUser(), true);
});

test('savedUserRole returns the stored role or null', () => {
  mockStorage(JSON.stringify({ user: { name: 'Alex', role: 'coach' } }));
  assert.equal(savedUserRole(), 'coach');
  mockStorage(JSON.stringify({ user: { name: 'Alex' } }));
  assert.equal(savedUserRole(), null);
  mockStorage(null);
  assert.equal(savedUserRole(), null);
});

test('pricing checkout uses a saved user, not only a leftover token', () => {
  const html = readFileSync(join(root, 'pricing.html'), 'utf8');
  assert.match(html, /pricingPlanAction/);
  assert.match(html, /if \(!hasSavedUser\(\)\)/);
  assert.match(html, /onboarding\.html\?plan=/);
  assert.doesNotMatch(html, /getToken\(\) \? 'Subscribe'/);
  assert.match(html, /invalid or expired token/i);
  assert.match(html, /pricingPlansForUser\(savedUserRole\(\)\)/);
  assert.match(html, /planAllowedForRole\(savedUserRole\(\), plan\)/);
  assert.match(html, /PLAN_NOT_AVAILABLE/);
  assert.match(html, /ALREADY_ON_PLAN/);
  assert.match(html, /SWITCH_VIA_BILLING/);
  assert.match(html, /getSubscriptionStatus/);
  assert.match(html, /switchPlan/);
  assert.match(html, /window.location.href = '\/login.html'/);
});

test('pricingPlanAction labels the current plan and leaves guests on Get Started', () => {
  assert.deepEqual(pricingPlanAction('elite', {}), { label: 'Get Started', disabled: false });
  assert.deepEqual(
    pricingPlanAction('elite', { loggedIn: true, currentPlan: 'elite', status: 'active' }),
    { label: 'Current Plan', disabled: true },
  );
  assert.deepEqual(
    pricingPlanAction('player', { loggedIn: true, currentPlan: 'elite', status: 'active' }),
    { label: 'Switch Plan', disabled: false, switchPlan: true },
  );
  assert.deepEqual(
    pricingPlanAction('elite', { loggedIn: true, currentPlan: 'elite', status: 'canceled' }),
    { label: 'Subscribe', disabled: false },
  );
  assert.deepEqual(
    pricingPlanAction('team', { loggedIn: true, currentPlan: 'team', status: 'trialing' }),
    { label: 'Current Plan', disabled: true },
  );
  assert.equal(ALREADY_ON_PLAN, "You're already on this plan");
  assert.equal(SWITCH_VIA_BILLING, 'Use Manage Billing to switch plans');
});
