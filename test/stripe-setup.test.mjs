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
  assert.match(setup, /Everything in Player plus monthly player evaluations/);
  assert.doesNotMatch(setup, /AI plans/);
});
