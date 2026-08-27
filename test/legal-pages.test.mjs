import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const publicPages = [
  'index.html',
  'pricing.html',
  'login.html',
  'onboarding.html',
  'privacy.html',
  'terms.html',
  'subscription/success.html',
];

test('privacy and terms pages exist and describe Stripe billing', () => {
  const privacy = read('privacy.html');
  const terms = read('terms.html');
  assert.match(privacy, /Privacy Policy/);
  assert.match(privacy, /Stripe/);
  assert.match(privacy, /privacy@futbol-training-lab\.com/);
  assert.match(terms, /Terms of Service/);
  assert.match(terms, /7-day trial/);
  assert.match(terms, /Stripe/);
});

test('public pages link to privacy and terms', () => {
  for (const file of publicPages) {
    const html = read(file);
    assert.match(html, /href="\/privacy\.html"/, file);
    assert.match(html, /href="\/terms\.html"/, file);
  }
});

test('onboarding requires agreeing to terms and privacy', () => {
  const html = read('onboarding.html');
  assert.match(html, /By creating an account you agree/);
  assert.match(html, /href="\/terms\.html"/);
  assert.match(html, /href="\/privacy\.html"/);
});

test('production image and Capacitor www copy include legal pages', () => {
  const docker = read('Dockerfile');
  const www = read('scripts/build-www.mjs');
  assert.match(docker, /privacy\.html/);
  assert.match(docker, /terms\.html/);
  assert.match(www, /privacy\.html/);
  assert.match(www, /terms\.html/);
});
