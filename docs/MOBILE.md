# Mobile App — Capacitor (iOS & Android)

Futbol Training Lab ships as a native app using [Capacitor](https://capacitorjs.com/) wrapping the web UI.

## Prerequisites

- Node.js (already installed)
- **Android:** [Android Studio](https://developer.android.com/studio) + Android SDK
- **iOS:** Mac with [Xcode](https://developer.apple.com/xcode/) (App Store builds require Apple Developer $99/year)
- **Google Play:** [Play Console](https://play.google.com/console) ($25 one-time)

## API URL for mobile builds

Native apps call your hosted API directly. Two ways to set it:

1. **At build time (recommended)** — pass `API_URL`; it overrides only the built
   `www/` output, so you can point staging vs prod builds without editing source:

   ```bash
   API_URL=https://YOUR-APP.up.railway.app/api npm run cap:sync
   ```

2. **In source** — change the default in `js/config/appConfig.js` → `NATIVE_API_URL`:

   ```javascript
   export const NATIVE_API_URL = 'https://YOUR-APP.up.railway.app/api';
   ```

Update Railway `FRONTEND_URL` CORS — the backend already allows Capacitor origins (`https://localhost`, `capacitor://localhost`).

## Build web assets & sync

Works on any OS (macOS, Linux, Windows):

```bash
npm run cap:sync
```

This copies static files to `www/` (via `scripts/build-www.mjs`), bundles the native
mobile helpers into `www/`, and syncs the native projects. On Windows you can
alternatively use the PowerShell copy step with `npm run build:www:ps`.

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
- [ ] Test signup, training, checkout (Stripe opens in system browser, then returns via `traininglab://`)
- [ ] Apple: subscriptions often sold on **website** (Stripe), not in-app IAP

## Stripe on mobile

Checkout still opens in the **system browser** via `@capacitor/browser`. The native app
sends `client: "native"` when creating a session, so Stripe’s `success_url` /
`cancel_url` (and the Customer Portal `return_url`) use the custom scheme:

| Event | Deep link |
|-------|-----------|
| Paid | `traininglab://checkout/success?plan={plan}&session_id={CHECKOUT_SESSION_ID}` |
| Canceled | `traininglab://checkout/cancel?canceled=true` |
| Portal return | `traininglab://portal` |

`@capacitor/app` listens for `appUrlOpen` / launch URL, closes the browser, verifies
the session when `session_id` is present, toasts, and routes to
`/subscription/success.html` or `/pricing.html?canceled=true`.

Override the scheme with `APP_DEEP_LINK_SCHEME` on the API (default `traininglab`).
`npm run cap:sync` writes the scheme into Android/iOS projects after `npx cap add`
(those folders are gitignored). You can also run `node scripts/apply-deeplink-config.mjs`
on its own.

## Commands

| Command | Description |
|---------|-------------|
| `npm run cap:sync` | Build www, sync Android/iOS, register `traininglab://` |
| `npm run cap:open:android` | Open Android Studio |
| `npm run cap:open:ios` | Open Xcode |
| `npm run cap:run:android` | Run on Android with live reload |
