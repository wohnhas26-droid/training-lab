import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const setup = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../backend/scripts/stripe-setup.js'),
  'utf8',
);

test('stripe setup script does not describe Elite as AI plans', () => {
  assert.match(setup, /Personalized training plans, video assessments, personalized feedback/);
  assert.doesNotMatch(setup, /AI plans/);
});
