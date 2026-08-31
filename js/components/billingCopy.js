export function pricingFooterCopy(configured) {
  return configured
    ? '© 2026 Futbol Training Lab. All plans include a 7-day free trial.'
    : '© 2026 Futbol Training Lab. Demo mode is not a paid subscription.';
}

export function pricingCanceledCopy(configured) {
  return configured
    ? 'Checkout was canceled. Pick a plan when you\'re ready — your 7-day trial starts at signup.'
    : 'Checkout was canceled. Demo checkouts do not start a paid trial.';
}

export function heroCtaCopy(configured) {
  return configured ? 'Start Free Trial' : 'Get Started';
}

export function checkoutSuccessCopy({ planName, demo } = {}) {
  if (demo) {
    return planName
      ? `Your ${planName} is saved in demo mode. This is not a paid trial.`
      : 'Your plan is saved in demo mode. This is not a paid trial.';
  }
  return planName
    ? `Your ${planName} is active. Your 7-day free trial has started.`
    : 'Your subscription is active. Start training today!';
}

export function isDemoCheckout({ demoParam, stripeConfigured } = {}) {
  if (demoParam === true || demoParam === 'true') return true;
  return stripeConfigured === false;
}
