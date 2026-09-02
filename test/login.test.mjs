import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('login sends a logged-in user to their dashboard', () => {
  const html = readFileSync(new URL('../login.html', import.meta.url), 'utf8');
  assert.match(html, /hasSavedUser\(\)/);
  assert.match(html, /dashboardForRole\(savedUserRole\(\)\)/);
  assert.match(html, /window\.location\.replace/);
  assert.match(html, /dashboardForRole\(state\.user\.role\)/);
  assert.doesNotMatch(html, /const routes = \{ player:/);
});
