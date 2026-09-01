import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { savedUserRole } from '../components/ui.js';
import { applyCheckoutReturn, parseCheckoutDeepLink } from './checkoutReturn.js';

export async function startCheckoutReturnListener({ verifyCheckoutSession, showToast } = {}) {
  const handle = async (url) => {
    const parsed = parseCheckoutDeepLink(url);
    if (!parsed) return;
    try {
      await Browser.close();
    } catch {
      // Browser may already be closed after the OS handed us the deep link.
    }
    await applyCheckoutReturn(parsed, {
      verifyCheckoutSession,
      showToast,
      role: savedUserRole(),
      navigate: (path) => {
        window.location.href = path;
      },
    });
  };

  try {
    const launch = await App.getLaunchUrl();
    if (launch?.url) await handle(launch.url);
  } catch {
    // Cold-start URL is optional.
  }

  App.addListener('appUrlOpen', ({ url }) => {
    handle(url);
  });
}
