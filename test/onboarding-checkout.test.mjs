import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ONBOARDING_WELCOME,
  ONBOARDING_CHECKOUT_FALLBACK,
  onboardingNextStep,
} from '../js/components/onboardingCheckout.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('onboarding without a plan welcomes and goes to the role dashboard', () => {
  assert.deepEqual(onboardingNextStep({ role: 'coach' }), {
    toast: ONBOARDING_WELCOME,
    href: '/coach/dashboard.html',
  });
});

test('onboarding with a checkout URL redirects to checkout', () => {
  assert.deepEqual(
    onboardingNextStep({
      plan: 'player',
      checkout: { url: '/subscription/success.html?plan=player&demo=true' },
      role: 'player',
    }),
    { redirect: '/subscription/success.html?plan=player&demo=true' },
  );
});

test('onboarding checkout failure toasts and sends the user to pricing', () => {
  assert.deepEqual(
    onboardingNextStep({
      plan: 'elite',
      error: new Error('Stripe not configured'),
      role: 'player',
    }),
    { toast: 'Stripe not configured', href: '/pricing.html' },
  );
});

test('onboarding checkout without a URL uses the fallback toast and pricing', () => {
  assert.deepEqual(
    onboardingNextStep({
      plan: 'player',
      checkout: { message: 'Checkout unavailable' },
      role: 'player',
    }),
    { toast: 'Checkout unavailable', href: '/pricing.html' },
  );
  assert.deepEqual(
    onboardingNextStep({ plan: 'player', checkout: {}, role: 'player' }),
    { toast: ONBOARDING_CHECKOUT_FALLBACK, href: '/pricing.html' },
  );
});

test('initOnboarding uses onboardingNextStep instead of swallowing checkout errors', () => {
  const app = readFileSync(join(root, 'js/app.js'), 'utf8');
  assert.match(app, /onboardingNextStep/);
  assert.doesNotMatch(app, /console\.warn\('Checkout redirect failed:/);
});
