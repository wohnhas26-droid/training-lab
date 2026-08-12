// Lightweight secret scanner for tracked files (no external dependencies).
// Fails (exit 1) if a high-signal secret pattern is found in the working tree,
// so credentials can't be committed. Run via `npm run scan:secrets`.
import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const SELF = 'scripts/scan-secrets.mjs';
const MAX_BYTES = 1_000_000;
const SKIP_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg', '.pdf',
  '.zip', '.gz', '.tar', '.woff', '.woff2', '.ttf', '.mp4', '.mov',
]);

// High-signal patterns — chosen to avoid matching obvious placeholders
// like `whsec_...`, `sk_test_...`, `sk-...` (too short to match).
const RULES = [
  ['Private key block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  ['Stripe webhook secret', /\bwhsec_[A-Za-z0-9]{20,}\b/],
  ['Stripe live secret key', /\bsk_live_[A-Za-z0-9]{16,}\b/],
  ['Stripe test secret key', /\bsk_test_[A-Za-z0-9]{16,}\b/],
  ['Stripe restricted key', /\brk_live_[A-Za-z0-9]{16,}\b/],
  ['AWS access key id', /\bAKIA[0-9A-Z]{16}\b/],
  ['OpenAI API key', /\bsk-[A-Za-z0-9]{20,}\b/],
  ['GitHub token', /\b(?:ghp|gho|ghs|ghr)_[A-Za-z0-9]{36}\b/],
];

const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
const findings = [];

for (const file of files) {
  if (file === SELF) continue;
  const dot = file.lastIndexOf('.');
  if (dot !== -1 && SKIP_EXT.has(file.slice(dot).toLowerCase())) continue;
  let size;
  try { size = statSync(file).size; } catch { continue; }
  if (size > MAX_BYTES) continue;

  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }

  const lines = text.split('\n');
  for (const [label, rule] of RULES) {
    lines.forEach((line, i) => {
      if (rule.test(line)) findings.push({ file, line: i + 1, label });
    });
  }
}

if (findings.length) {
  console.error('Potential secrets detected in tracked files:\n');
  for (const f of findings) console.error(`  ${f.file}:${f.line}  [${f.label}]`);
  console.error('\nRemove the secret, use an env var / secret manager, and rotate the exposed value.');
  process.exit(1);
}

console.log(`No secrets detected in ${files.length} tracked files.`);
