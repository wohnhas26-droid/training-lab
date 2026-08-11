// Verifies the CORS origin policy that lets the Capacitor native app webview
// (capacitor://localhost, https://localhost) call the hosted API in production,
// while blocking unknown origins.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isOriginAllowed, NATIVE_ORIGINS } from '../src/config.js';

const prod = { nodeEnv: 'production', frontendUrl: 'https://app.example.com' };
const dev = { nodeEnv: 'development', frontendUrl: 'https://app.example.com' };

test('no Origin header (native fetch / curl) is allowed', () => {
  assert.equal(isOriginAllowed(undefined, prod), true);
  assert.equal(isOriginAllowed('', prod), true);
});

test('Capacitor webview origins are allowed in production', () => {
  assert.equal(isOriginAllowed('capacitor://localhost', prod), true);
  assert.equal(isOriginAllowed('https://localhost', prod), true);
  assert.equal(isOriginAllowed('ionic://localhost', prod), true);
});

test('the configured frontend origin is allowed in production', () => {
  assert.equal(isOriginAllowed('https://app.example.com', prod), true);
});

test('unknown origins are blocked in production but allowed in development', () => {
  assert.equal(isOriginAllowed('https://evil.example.com', prod), false);
  assert.equal(isOriginAllowed('https://evil.example.com', dev), true);
});

test('NATIVE_ORIGINS covers the Capacitor schemes', () => {
  assert.ok(NATIVE_ORIGINS.includes('capacitor://localhost'));
  assert.ok(NATIVE_ORIGINS.includes('https://localhost'));
});
