// Copy web assets into www/ for Capacitor (cross-platform Node replacement
// for build-www.ps1). Run via `npm run build:www`, which then bundles the
// native mobile helpers into www/ on top of this copy.
import { rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');

const copyItems = [
  'index.html', 'login.html', 'onboarding.html', 'pricing.html',
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

console.log('www/ ready for Capacitor sync.');
