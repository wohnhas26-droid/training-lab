/** Production API used by iOS/Android builds (Capacitor). Update if using Railway URL temporarily. */
export const NATIVE_API_URL = 'https://www.futbol-training-lab.com/api';

/** Custom URL scheme Stripe uses to return to the native app after checkout. */
export const APP_DEEP_LINK_SCHEME = 'traininglab';

export function isNativeApp() {
  return typeof window.Capacitor !== 'undefined'
    && window.Capacitor.isNativePlatform?.();
}

export function resolveApiBase() {
  if (window.__API_URL__) return window.__API_URL__;
  if (isNativeApp()) return NATIVE_API_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  return `${window.location.origin}/api`;
}
