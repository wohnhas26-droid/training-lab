import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCheckoutReturn, parseCheckoutDeepLink, portalReturnPathForRole } from '../js/utils/checkoutReturn.js';
import { CHECKOUT_VERIFY_FAILED } from '../js/components/billingCopy.js';
import { readFileSync } from 'node:fs';

test('parseCheckoutDeepLink maps native success and cancel URLs', () => {
  assert.deepEqual(
    parseCheckoutDeepLink('traininglab://checkout/success?plan=elite&session_id=cs_test_123'),
    { type: 'success', plan: 'elite', sessionId: 'cs_test_123', demo: false },
  );
  assert.deepEqual(
    parseCheckoutDeepLink('traininglab://checkout/cancel?canceled=true'),
    { type: 'cancel' },
  );
  assert.deepEqual(parseCheckoutDeepLink('traininglab://portal'), { type: 'portal' });
});

test('parseCheckoutDeepLink maps existing web return URLs', () => {
  assert.deepEqual(
    parseCheckoutDeepLink('http://localhost:8080/subscription/success.html?plan=player&session_id=cs_live'),
    { type: 'success', plan: 'player', sessionId: 'cs_live', demo: false },
  );
  assert.deepEqual(
    parseCheckoutDeepLink('https://www.futbol-training-lab.com/pricing.html?canceled=true'),
    { type: 'cancel' },
  );
  assert.equal(parseCheckoutDeepLink('https://example.com/player/dashboard.html'), null);
  assert.deepEqual(
    parseCheckoutDeepLink('https://www.futbol-training-lab.com/player/profile.html'),
    { type: 'portal' },
  );
  assert.deepEqual(
    parseCheckoutDeepLink('https://www.futbol-training-lab.com/coach/dashboard.html'),
    { type: 'portal' },
  );
  assert.deepEqual(
    parseCheckoutDeepLink('https://www.futbol-training-lab.com/parent/dashboard.html'),
    { type: 'portal' },
  );
  assert.equal(parseCheckoutDeepLink('javascript:alert(1)'), null);
});

test('applyCheckoutReturn verifies once then navigates to success', async () => {
  const calls = [];
  const result = await applyCheckoutReturn(
    { type: 'success', plan: 'elite', sessionId: 'cs_test_123', demo: false },
    {
      verifyCheckoutSession: async (id) => { calls.push(id); },
      showToast: (msg) => { calls.push(msg); },
      navigate: (path) => { calls.push(path); },
    },
  );
  assert.deepEqual(result, { handled: true, type: 'success' });
  assert.deepEqual(calls, ['cs_test_123', 'Subscription active!', '/subscription/success.html?plan=elite']);
});

test('applyCheckoutReturn keeps demo=true on the success URL', async () => {
  const calls = [];
  const result = await applyCheckoutReturn(
    { type: 'success', plan: 'player', sessionId: null, demo: true },
    {
      showToast: (msg) => { calls.push(msg); },
      navigate: (path) => { calls.push(path); },
    },
  );
  assert.deepEqual(result, { handled: true, type: 'success' });
  assert.deepEqual(calls, ['Subscription active!', '/subscription/success.html?plan=player&demo=true']);
});

test('applyCheckoutReturn cancel goes to pricing', async () => {
  const calls = [];
  const result = await applyCheckoutReturn(
    { type: 'cancel' },
    {
      showToast: (msg) => { calls.push(msg); },
      navigate: (path) => { calls.push(path); },
    },
  );
  assert.deepEqual(result, { handled: true, type: 'cancel' });
  assert.deepEqual(calls, ['Checkout canceled', '/pricing.html?canceled=true']);
});

test('applyCheckoutReturn does not claim a subscription when verify fails', async () => {
  const calls = [];
  const result = await applyCheckoutReturn(
    { type: 'success', plan: 'elite', sessionId: 'cs_bad', demo: false },
    {
      verifyCheckoutSession: async () => { throw new Error('Session does not belong to this user'); },
      showToast: (msg) => { calls.push(msg); },
      navigate: (path) => { calls.push(path); },
    },
  );
  assert.deepEqual(result, { handled: true, type: 'success', confirmed: false });
  assert.deepEqual(calls, [CHECKOUT_VERIFY_FAILED, '/subscription/success.html?plan=elite&confirm=failed']);
  assert.equal(calls.includes('Subscription active!'), false);
});

test('portalReturnPathForRole maps coach and parent to their dashboards', () => {
  assert.equal(portalReturnPathForRole('coach'), '/coach/dashboard.html');
  assert.equal(portalReturnPathForRole('parent'), '/parent/dashboard.html');
  assert.equal(portalReturnPathForRole('player'), '/player/profile.html');
  assert.equal(portalReturnPathForRole(null), '/player/profile.html');
});

test('applyCheckoutReturn portal follows the account role', async () => {
  const paths = [];
  await applyCheckoutReturn({ type: 'portal' }, { role: 'coach', navigate: (path) => paths.push(path) });
  await applyCheckoutReturn({ type: 'portal' }, { role: 'parent', navigate: (path) => paths.push(path) });
  await applyCheckoutReturn({ type: 'portal' }, { role: 'player', navigate: (path) => paths.push(path) });
  await applyCheckoutReturn({ type: 'portal' }, { navigate: (path) => paths.push(path) });
  assert.deepEqual(paths, [
    '/coach/dashboard.html',
    '/parent/dashboard.html',
    '/player/profile.html',
    '/player/profile.html',
  ]);
});

test('native portal listener reads the saved account role', () => {
  const src = readFileSync(new URL('../js/utils/listenCheckoutReturn.native.js', import.meta.url), 'utf8');
  assert.match(src, /savedUserRole/);
  assert.match(src, /role:\s*savedUserRole\(\)/);
});
