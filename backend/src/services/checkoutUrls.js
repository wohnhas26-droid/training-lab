const DEFAULT_SCHEME = 'traininglab';
const DEFAULT_FRONTEND = 'http://localhost:8080';

export function normalizeDeepLinkScheme(scheme) {
  const raw = String(scheme || DEFAULT_SCHEME).trim().toLowerCase();
  const withoutProtocol = raw.replace(/:\/\/.*$/, '');
  const cleaned = withoutProtocol.replace(/[^a-z0-9+.-]/g, '');
  return cleaned || DEFAULT_SCHEME;
}

export function normalizeCheckoutClient(client) {
  return client === 'native' ? 'native' : 'web';
}

export function buildCheckoutReturnUrls({
  frontendUrl = DEFAULT_FRONTEND,
  scheme = DEFAULT_SCHEME,
  plan = 'player',
  client = 'web',
} = {}) {
  const safePlan = encodeURIComponent(plan || 'player');
  const safeScheme = normalizeDeepLinkScheme(scheme);
  const base = String(frontendUrl || DEFAULT_FRONTEND).replace(/\/$/, '');
  const target = normalizeCheckoutClient(client);

  if (target === 'native') {
    return {
      successUrl: `${safeScheme}://checkout/success?plan=${safePlan}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${safeScheme}://checkout/cancel?canceled=true`,
      portalReturnUrl: `${safeScheme}://portal`,
      demoSuccessUrl: `${safeScheme}://checkout/success?plan=${safePlan}&demo=true`,
    };
  }

  return {
    successUrl: `${base}/subscription/success.html?plan=${safePlan}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/pricing.html?canceled=true`,
    portalReturnUrl: `${base}/player/profile.html`,
    demoSuccessUrl: `${base}/subscription/success.html?plan=${safePlan}&demo=true`,
  };
}
