import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  pricingFooterCopy,
  pricingCanceledCopy,
  heroCtaCopy,
  closingCtaCopy,
  checkoutSuccessCopy,
  isDemoCheckout,
} from '../js/components/billingCopy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

test('pricing copy promises a trial only when Stripe is configured', () => {
  assert.match(pricingFooterCopy(true), /7-day free trial/);
  assert.doesNotMatch(pricingFooterCopy(false), /7-day free trial/);
  assert.match(pricingFooterCopy(false), /not a paid subscription/);
  assert.match(pricingCanceledCopy(true), /7-day trial starts at signup/);
  assert.doesNotMatch(pricingCanceledCopy(false), /7-day trial/);
  assert.match(pricingCanceledCopy(false), /do not start a paid trial/);
});

test('hero CTA says Start Free Trial only when Stripe is configured', () => {
  assert.equal(heroCtaCopy(true), 'Start Free Trial');
  assert.equal(heroCtaCopy(false), 'Get Started');
});

test('closing CTA shows the player price only when Stripe is configured', () => {
  assert.equal(closingCtaCopy(true), 'Get Started — $29.99/mo');
  assert.equal(closingCtaCopy(false), 'Get Started');
});

test('checkout success does not claim a trial in demo mode', () => {
  assert.match(
    checkoutSuccessCopy({ planName: 'Player Membership', demo: false }),
    /7-day free trial has started/,
  );
  assert.equal(
    checkoutSuccessCopy({ planName: 'Player Membership', demo: true }),
    'Your Player Membership is saved in demo mode. This is not a paid trial.',
  );
  assert.doesNotMatch(checkoutSuccessCopy({ demo: true }), /trial has started/);
});

test('isDemoCheckout treats demo=true and unconfigured Stripe as demo', () => {
  assert.equal(isDemoCheckout({ demoParam: 'true', stripeConfigured: true }), true);
  assert.equal(isDemoCheckout({ demoParam: null, stripeConfigured: false }), true);
  assert.equal(isDemoCheckout({ demoParam: null, stripeConfigured: true }), false);
});

test('homepage default CTA is Get Started and wires Stripe-aware copy', () => {
  const html = read('index.html');
  assert.match(html, /id="hero-cta"/);
  assert.match(html, /id="closing-cta"/);
  assert.match(html, />Get Started</);
  assert.doesNotMatch(html, />Start Free Trial</);
  assert.doesNotMatch(html, /Get Started — \$29\.99\/mo/);
  assert.match(html, /heroCtaCopy/);
  assert.match(html, /closingCtaCopy/);
});

test('pricing page rewrites footer and canceled copy from billing helpers', () => {
  const html = read('pricing.html');
  assert.match(html, /pricingFooterCopy/);
  assert.match(html, /pricingCanceledCopy/);
  assert.match(html, /id="pricing-footer-note"/);
  assert.match(html, /id="canceled-copy"/);
});

test('success page uses demo checkout copy instead of claiming a trial', () => {
  const html = read('subscription/success.html');
  assert.match(html, /checkoutSuccessCopy/);
  assert.match(html, /isDemoCheckout/);
  assert.doesNotMatch(html, /Your 7-day free trial has started/);
});

test('offline checkout URL marks demo mode', () => {
  const src = read('js/services/dataStore.js');
  assert.match(src, /subscription\/success\.html\?plan='/);
  assert.match(src, /demo=true/);
});

test('native checkout return keeps the demo flag on the success URL', () => {
  const src = read('js/utils/checkoutReturn.js');
  assert.match(src, /parsed\.demo/);
  assert.match(src, /qs\.set\('demo'/);
});
