// The API must refuse to run in production with a missing/insecure JWT secret.
import test from 'node:test';
import assert from 'node:assert/strict';
import { jwtSecretIssue } from '../src/config.js';

test('development never reports an issue (permissive locally)', () => {
  assert.equal(jwtSecretIssue(null, 'development'), null);
  assert.equal(jwtSecretIssue('dev-secret-change-in-production', 'development'), null);
});

test('production rejects a missing secret', () => {
  assert.match(jwtSecretIssue(null, 'production'), /not set/);
  assert.match(jwtSecretIssue('', 'production'), /not set/);
});

test('production rejects known insecure defaults', () => {
  assert.match(jwtSecretIssue('dev-secret-change-in-production', 'production'), /insecure default/);
  assert.match(jwtSecretIssue('change-me-in-production', 'production'), /insecure default/);
});

test('production rejects too-short secrets', () => {
  assert.match(jwtSecretIssue('short', 'production'), /too short/);
});

test('production accepts a strong secret', () => {
  assert.equal(jwtSecretIssue('a-sufficiently-long-random-secret-value', 'production'), null);
});
