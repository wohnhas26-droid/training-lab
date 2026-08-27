// Copy web assets into www/ for Capacitor (cross-platform Node replacement
// for build-www.ps1). Run via `npm run build:www`, which then bundles the
// native mobile helpers into www/ on top of this copy.
import { rmSync, mkdirSync, cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');

const copyItems = [
  'index.html', 'login.html', 'onboarding.html', 'pricing.html',
  'privacy.html', 'terms.html',
  'css', 'js', 'player', 'coach', 'parent', 'subscription',
];

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

for (const item of copyItems) {
  const src = join(root, item);
  if (existsSync(src)) {
    cpSync(src, join(www, item), { recursive: true });
  }
}

// Optionally override the native API base URL at build time (e.g. staging vs
// prod) without editing source. Rewrites only the copied www/ output.
const apiUrl = process.env.API_URL || process.env.NATIVE_API_URL;
if (apiUrl) {
  if (!/^https?:\/\//.test(apiUrl) || apiUrl.includes("'")) {
    throw new Error(`Invalid API_URL: ${apiUrl} (must start with http(s):// and contain no single quotes)`);
  }
  const appConfigPath = join(www, 'js', 'config', 'appConfig.js');
  const cfg = readFileSync(appConfigPath, 'utf8');
  const next = cfg.replace(/export const NATIVE_API_URL = '[^']*';/, `export const NATIVE_API_URL = '${apiUrl}';`);
  if (next === cfg) {
    throw new Error('Could not find NATIVE_API_URL declaration to override in www/js/config/appConfig.js');
  }
  writeFileSync(appConfigPath, next);
  console.log(`Set native API URL → ${apiUrl}`);
} else {
  console.log('Using default NATIVE_API_URL from source (set API_URL to override).');
}

console.log('www/ ready for Capacitor sync.');
