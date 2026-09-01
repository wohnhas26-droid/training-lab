import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCheckoutReturnUrls,
  normalizeCheckoutClient,
  normalizeDeepLinkScheme,
  portalReturnPathForRole,
} from '../src/services/checkoutUrls.js';
import { createCheckoutSession } from '../src/services/stripe.js';
import { readFileSync } from 'node:fs';

test('normalizeCheckoutClient only accepts native', () => {
  assert.equal(normalizeCheckoutClient('native'), 'native');
  assert.equal(normalizeCheckoutClient('web'), 'web');
  assert.equal(normalizeCheckoutClient('other'), 'web');
  assert.equal(normalizeCheckoutClient(undefined), 'web');
});

test('normalizeDeepLinkScheme strips protocols and illegal characters', () => {
  assert.equal(normalizeDeepLinkScheme('traininglab'), 'traininglab');
  assert.equal(normalizeDeepLinkScheme('TrainingLab://evil'), 'traininglab');
  assert.equal(normalizeDeepLinkScheme('not a scheme!'), 'notascheme');
  assert.equal(normalizeDeepLinkScheme(''), 'traininglab');
});

test('web return URLs stay on FRONTEND_URL', () => {
  const urls = buildCheckoutReturnUrls({
    frontendUrl: 'https://www.futbol-training-lab.com',
    plan: 'elite',
    client: 'web',
  });
  assert.equal(
    urls.successUrl,
    'https://www.futbol-training-lab.com/subscription/success.html?plan=elite&session_id={CHECKOUT_SESSION_ID}',
  );
  assert.equal(urls.cancelUrl, 'https://www.futbol-training-lab.com/pricing.html?canceled=true');
  assert.equal(urls.portalReturnUrl, 'https://www.futbol-training-lab.com/player/profile.html');
  assert.equal(
    urls.demoSuccessUrl,
    'https://www.futbol-training-lab.com/subscription/success.html?plan=elite&demo=true',
  );
});

test('web portal return URL follows the account role', () => {
  const base = { frontendUrl: 'https://www.futbol-training-lab.com', client: 'web' };
  assert.equal(
    buildCheckoutReturnUrls({ ...base, role: 'player' }).portalReturnUrl,
    'https://www.futbol-training-lab.com/player/profile.html',
  );
  assert.equal(
    buildCheckoutReturnUrls({ ...base, role: 'coach' }).portalReturnUrl,
    'https://www.futbol-training-lab.com/coach/dashboard.html',
  );
  assert.equal(
    buildCheckoutReturnUrls({ ...base, role: 'parent' }).portalReturnUrl,
    'https://www.futbol-training-lab.com/parent/dashboard.html',
  );
  assert.equal(portalReturnPathForRole('coach'), '/coach/dashboard.html');
  assert.equal(portalReturnPathForRole('parent'), '/parent/dashboard.html');
  assert.equal(portalReturnPathForRole('player'), '/player/profile.html');
  assert.equal(portalReturnPathForRole(undefined), '/player/profile.html');
});

test('native return URLs use the custom scheme', () => {
  const urls = buildCheckoutReturnUrls({
    frontendUrl: 'http://localhost:8080',
    scheme: 'traininglab',
    plan: 'player',
    client: 'native',
  });
  assert.equal(
    urls.successUrl,
    'traininglab://checkout/success?plan=player&session_id={CHECKOUT_SESSION_ID}',
  );
  assert.equal(urls.cancelUrl, 'traininglab://checkout/cancel?canceled=true');
  assert.equal(urls.portalReturnUrl, 'traininglab://portal');
  assert.equal(urls.demoSuccessUrl, 'traininglab://checkout/success?plan=player&demo=true');
});

test('demo checkout session uses web success page by default', async () => {
  const result = await createCheckoutSession('user-1', 'elite', { client: 'web' });
  assert.equal(result.demo, true);
  assert.match(result.url, /\/subscription\/success\.html\?plan=elite&demo=true$/);
});

test('demo checkout session uses a deep link for native clients', async () => {
  const result = await createCheckoutSession('user-1', 'team', { client: 'native' });
  assert.equal(result.demo, true);
  assert.equal(result.url, 'traininglab://checkout/success?plan=team&demo=true');
});

test('createPortalSession passes the user role into return URLs', () => {
  const src = readFileSync(new URL('../src/services/stripe.js', import.meta.url), 'utf8');
  assert.match(src, /checkoutUrlsFor\('player',\s*options\.client,\s*user\.role\)/);
});
