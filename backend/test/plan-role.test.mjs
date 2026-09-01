import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planAllowedForRole } from '../src/config.js';

test('checkout plans match account roles', () => {
  assert.equal(planAllowedForRole('coach', 'team'), true);
  assert.equal(planAllowedForRole('coach', 'player'), false);
  assert.equal(planAllowedForRole('coach', 'elite'), false);
  assert.equal(planAllowedForRole('player', 'player'), true);
  assert.equal(planAllowedForRole('player', 'elite'), true);
  assert.equal(planAllowedForRole('player', 'team'), false);
  assert.equal(planAllowedForRole('parent', 'player'), true);
  assert.equal(planAllowedForRole('parent', 'elite'), true);
  assert.equal(planAllowedForRole('parent', 'team'), false);
  assert.equal(planAllowedForRole(undefined, 'player'), false);
});

test('checkout route rejects plans that do not match the account role', () => {
  const src = readFileSync(new URL('../src/routes/subscriptions.js', import.meta.url), 'utf8');
  assert.match(src, /planAllowedForRole\(user\?\.role, plan\)/);
  assert.match(src, /That plan is not available for this account/);
});
