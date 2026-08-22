import * as esbuild from 'esbuild';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const bundles = [
  {
    entry: join(root, 'js', 'utils', 'openUrl.native.js'),
    outfile: join(root, 'www', 'js', 'utils', 'openUrl.js'),
  },
  {
    entry: join(root, 'js', 'utils', 'listenCheckoutReturn.native.js'),
    outfile: join(root, 'www', 'js', 'utils', 'listenCheckoutReturn.js'),
  },
];

for (const { entry, outfile } of bundles) {
  mkdirSync(dirname(outfile), { recursive: true });
  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    sourcemap: true,
  });
}

console.log('Bundled mobile helpers → www/js/utils/openUrl.js, listenCheckoutReturn.js');
