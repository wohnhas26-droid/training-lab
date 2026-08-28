import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderNav } from '../js/components/ui.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function mockStorage(raw) {
  globalThis.localStorage = {
    getItem: () => raw,
  };
}

test('nav shows Log In when localStorage is empty', () => {
  mockStorage(null);
  const html = renderNav();
  assert.match(html, /Log In/);
  assert.match(html, /Get Started/);
  assert.doesNotMatch(html, /Log Out/);
});

test('nav shows Log In when saved state has a null user', () => {
  mockStorage(JSON.stringify({ user: null }));
  const html = renderNav();
  assert.match(html, /Log In/);
  assert.doesNotMatch(html, /Log Out/);
});

test('nav logout uses data-action instead of inline onclick', () => {
  mockStorage(JSON.stringify({ user: { name: 'Alex', role: 'player' } }));
  const html = renderNav();
  assert.match(html, /Log Out/);
  assert.match(html, /data-action="logout"/);
  assert.doesNotMatch(html, /onclick=/);
});

test('app.js binds logout without relying on inline handlers', () => {
  const app = readFileSync(join(root, 'js/app.js'), 'utf8');
  assert.match(app, /data-action="logout"/);
  assert.match(app, /Could not create account/);
});
