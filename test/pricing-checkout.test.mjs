import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasSavedUser, savedUserRole } from '../js/components/ui.js';

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
  assert.match(html, /hasSavedUser\(\) \? 'Subscribe' : 'Get Started'/);
  assert.match(html, /if \(!hasSavedUser\(\)\)/);
  assert.match(html, /onboarding\.html\?plan=/);
  assert.doesNotMatch(html, /getToken\(\) \? 'Subscribe'/);
  assert.match(html, /invalid or expired token/i);
  assert.match(html, /pricingPlansForUser\(savedUserRole\(\)\)/);
  assert.match(html, /planAllowedForRole\(savedUserRole\(\), plan\)/);
  assert.match(html, /PLAN_NOT_AVAILABLE/);
});
