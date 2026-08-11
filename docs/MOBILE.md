# Mobile App — Capacitor (iOS & Android)

Futbol Training Lab ships as a native app using [Capacitor](https://capacitorjs.com/) wrapping the web UI.

## Prerequisites

- Node.js (already installed)
- **Android:** [Android Studio](https://developer.android.com/studio) + Android SDK
- **iOS:** Mac with [Xcode](https://developer.apple.com/xcode/) (App Store builds require Apple Developer $99/year)
- **Google Play:** [Play Console](https://play.google.com/console) ($25 one-time)

## API URL for mobile builds

Native apps call your hosted API directly. Edit before building:

`js/config/appConfig.js` → `NATIVE_API_URL`

Use your Railway URL until custom domain DNS works:

```javascript
export const NATIVE_API_URL = 'https://YOUR-APP.up.railway.app/api';
```

Update Railway `FRONTEND_URL` CORS — the backend already allows Capacitor origins (`https://localhost`, `capacitor://localhost`).

## Build web assets & sync

```powershell
cd C:\Users\Ryan\training-lab
npm run cap:sync
```

This copies static files to `www/`, bundles mobile helpers, and syncs native projects.

## Run on device / emulator

**Android:**
```powershell
npm run cap:open:android
```
Android Studio → Run on emulator or connected phone.

**iOS (Mac only):**
```powershell
npm run cap:open:ios
```
Xcode → Run on simulator or device.

## Live reload during development

```powershell
npm run cap:run:android
# or
npm run cap:run:ios
```

## App icons & splash screens

Source art lives in [`assets/`](../assets/README.md) (`logo.png`, `icon-only.png`).
Generate native assets with:

```bash
npm run assets:generate
```

Add platforms first (`npx cap add android|ios`) so the icons/splashes are written
into the native projects; without platforms it generates PWA icons and skips
native with a warning. Replace `assets/logo.png` with your own artwork (≥1024×1024)
to rebrand.

## App Store submission checklist

- [x] App icon + splash source art in `assets/` (run `npm run assets:generate`)
- [ ] Splash screen tuning (see `capacitor.config.json` SplashScreen)
- [ ] Privacy Policy URL (required)
- [ ] Screenshots (phone + tablet sizes)
- [ ] `NATIVE_API_URL` points to production API
- [ ] Test signup, training, checkout (Stripe opens in system browser)
- [ ] Apple: subscriptions often sold on **website** (Stripe), not in-app IAP

## Stripe on mobile

Checkout opens in the **system browser** via `@capacitor/browser`. After payment, users return to the app manually (deep links can be added later).

## Commands

| Command | Description |
|---------|-------------|
| `npm run cap:sync` | Build www + sync Android/iOS |
| `npm run cap:open:android` | Open Android Studio |
| `npm run cap:open:ios` | Open Xcode |
| `npm run cap:run:android` | Run on Android with live reload |
