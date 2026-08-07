import * as esbuild from 'esbuild';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outFile = join(root, 'www', 'js', 'utils', 'openUrl.js');

mkdirSync(dirname(outFile), { recursive: true });

await esbuild.build({
  entryPoints: [join(root, 'js', 'utils', 'openUrl.native.js')],
  outfile: outFile,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  sourcemap: true,
});

console.log('Bundled mobile helpers → www/js/utils/openUrl.js');
