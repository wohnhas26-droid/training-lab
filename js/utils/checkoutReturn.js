import { CHECKOUT_VERIFY_FAILED } from '../components/billingCopy.js';

function pathFromUrl(parsed) {
  const host = parsed.hostname || '';
  const pathname = (parsed.pathname || '').replace(/\/+$/, '');
  if (host && pathname) return `${host}${pathname}`;
  if (host) return host;
  return pathname.replace(/^\/+/, '');
}

export function parseCheckoutDeepLink(url) {
  if (!url || typeof url !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const params = parsed.searchParams;
  const path = pathFromUrl(parsed);

  if (path === 'checkout/success' || path.endsWith('subscription/success.html')) {
    return {
      type: 'success',
      plan: params.get('plan'),
      sessionId: params.get('session_id'),
      demo: params.get('demo') === 'true',
    };
  }

  if (path === 'checkout/cancel' || params.get('canceled') === 'true') {
    return { type: 'cancel' };
  }

  if (path === 'portal' || path.endsWith('player/profile.html')) {
    return { type: 'portal' };
  }

  if (params.get('subscribed') === 'true') {
    return {
      type: 'success',
      plan: params.get('plan'),
      sessionId: params.get('session_id'),
      demo: true,
    };
  }

  return null;
}

export async function applyCheckoutReturn(parsed, deps = {}) {
  if (!parsed) return { handled: false };

  if (parsed.type === 'success') {
    const qs = new URLSearchParams();
    if (parsed.plan) qs.set('plan', parsed.plan);
    if (parsed.demo) qs.set('demo', 'true');
    if (parsed.sessionId && deps.verifyCheckoutSession) {
      try {
        await deps.verifyCheckoutSession(parsed.sessionId);
      } catch {
        deps.showToast?.(CHECKOUT_VERIFY_FAILED);
        qs.set('confirm', 'failed');
        const query = qs.toString();
        deps.navigate?.(`/subscription/success.html?${query}`);
        return { handled: true, type: 'success', confirmed: false };
      }
    }
    deps.showToast?.('Subscription active!');
    const query = qs.toString();
    const successPath = query
      ? `/subscription/success.html?${query}`
      : '/subscription/success.html';
    deps.navigate?.(successPath);
    return { handled: true, type: 'success' };
  }

  if (parsed.type === 'cancel') {
    deps.showToast?.('Checkout canceled');
    deps.navigate?.('/pricing.html?canceled=true');
    return { handled: true, type: 'cancel' };
  }

  if (parsed.type === 'portal') {
    deps.navigate?.('/player/profile.html');
    return { handled: true, type: 'portal' };
  }

  return { handled: false };
}
