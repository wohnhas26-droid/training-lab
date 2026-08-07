/** Open external URLs — Capacitor system browser on native, same tab on web. */
export async function openUrl(url) {
  if (!url) return;
  try {
    const { Capacitor } = await import('@capacitor/core');
    const { Browser } = await import('@capacitor/browser');
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }
  } catch {
    // Web dev: Capacitor packages not loaded in browser
  }
  window.location.href = url;
}
