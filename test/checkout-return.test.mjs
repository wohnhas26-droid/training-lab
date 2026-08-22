import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCheckoutReturn, parseCheckoutDeepLink } from '../js/utils/checkoutReturn.js';

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
