import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isProtectedPath } from '../js/utils/protectedPath.js';

test('player, coach, and parent pages are protected', () => {
  assert.equal(isProtectedPath('/player/dashboard.html'), true);
  assert.equal(isProtectedPath('/coach/dashboard.html'), true);
  assert.equal(isProtectedPath('/parent/reports.html'), true);
});

test('public pages are not protected', () => {
  assert.equal(isProtectedPath('/index.html'), false);
  assert.equal(isProtectedPath('/login.html'), false);
  assert.equal(isProtectedPath('/onboarding.html'), false);
  assert.equal(isProtectedPath('/pricing.html'), false);
  assert.equal(isProtectedPath('/subscription/success.html'), false);
});

test('bootstrap logs out a leftover user when the API is up and there is no token', () => {
  const src = readFileSync(new URL('../js/services/dataStore.js', import.meta.url), 'utf8');
  assert.match(src, /else if \(isApiMode\(\) && \(cachedState\?\.user \|\| local\.loadState\(\)\.user\)\)/);
  assert.match(src, /logout\(\)/);
});

test('app sends an expired protected session to login after bootstrap', () => {
  const src = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.match(src, /isProtectedPath\(window\.location\.pathname\) && !loadState\(\)\.user/);
  assert.match(src, /window\.location\.replace\('\/login.html'\)/);
});
