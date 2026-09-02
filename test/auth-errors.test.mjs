import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('API 401 with a token clears the session; login 401 keeps the server error', () => {
  const src = readFileSync(new URL('../js/services/api.js', import.meta.url), 'utf8');
  assert.match(src, /res.status === 401 && token/);
  assert.match(src, /clearSavedSession\(\)/);
  assert.doesNotMatch(src, /throw new Error\('Session expired'\)/);
});

test('bootstrap logs out when the saved token is no longer valid', () => {
  const src = readFileSync(new URL('../js/services/dataStore.js', import.meta.url), 'utf8');
  assert.match(src, /cachedState = await api.me\(\)/);
  assert.match(src, /logout\(\)/);
  assert.match(src, /isApiMode\(\) && !getToken\(\)/);
});

test('pricing sends an expired checkout session to login, not signup', () => {
  const html = readFileSync(new URL('../pricing.html', import.meta.url), 'utf8');
  assert.match(html, /invalid or expired token[\s\S]*?\/login.html/);
  assert.doesNotMatch(html, /invalid or expired token[\s\S]*?onboarding.html/);
});

test('home and pricing re-render nav after bootstrap so an expired token looks logged out', () => {
  const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const pricing = readFileSync(new URL('../pricing.html', import.meta.url), 'utf8');
  assert.match(home, /await TrainingLab\.ready\(\);\s*document\.getElementById\('nav'\)\.innerHTML = renderNav\('home'\);/);
  assert.match(pricing, /await TrainingLab\.ready\(\);\s*document\.getElementById\('nav'\)\.innerHTML = renderNav\('pricing'\);/);
});
