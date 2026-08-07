import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export async function openUrl(url) {
  if (!url) return;
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
    return;
  }
  window.location.href = url;
}
