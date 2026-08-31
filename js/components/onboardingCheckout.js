const ROLE_ROUTES = {
  player: '/player/dashboard.html',
  coach: '/coach/dashboard.html',
  parent: '/parent/dashboard.html',
};

export const ONBOARDING_WELCOME = 'Welcome to Futbol Training Lab!';
export const ONBOARDING_CHECKOUT_FALLBACK =
  'Checkout failed. Your account was created — subscribe from Pricing.';

export function dashboardForRole(role) {
  return ROLE_ROUTES[role] || ROLE_ROUTES.player;
}

export function onboardingNextStep({ plan, checkout, error, role } = {}) {
  if (!plan) {
    return { toast: ONBOARDING_WELCOME, href: dashboardForRole(role) };
  }

  if (!error && checkout?.url) {
    return { redirect: checkout.url };
  }

  const message = error?.message || checkout?.message || ONBOARDING_CHECKOUT_FALLBACK;
  return { toast: message, href: '/pricing.html' };
}
