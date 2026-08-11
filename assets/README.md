# App assets (icons & splash screens)

Source brand images for generating native app icons and splash screens with
[`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets).

## Files

- `logo.png` — primary brand mark (1024×1024). Used to generate both icons and
  splash screens (centered on the brand background color).
- `icon-only.png` — square app icon source (1024×1024).

To customize, replace these with your own artwork at the same (or larger) sizes.
Optional extras `@capacitor/assets` supports: `logo-dark.png`,
`icon-foreground.png` + `icon-background.png` (Android adaptive icons),
`splash.png` + `splash-dark.png` (≥2732×2732 for a bespoke splash).

## Generate

```bash
npm run assets:generate
```

This reads the sources here and writes platform assets into the native
projects. Add the platforms first (requires the Android SDK / Xcode):

```bash
npm run build:www
npx cap add android   # and/or: npx cap add ios
npm run assets:generate
```

Without native platforms present, the command still generates PWA icons (into
`icons/`, which is gitignored) and skips iOS/Android with a warning.

The brand background color (`#0f172a`) matches the splash/status-bar colors in
`capacitor.config.json`.
