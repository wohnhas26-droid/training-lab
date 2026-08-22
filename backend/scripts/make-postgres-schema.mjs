// Generate prisma/schema.postgres.prisma from the canonical prisma/schema.prisma
// by swapping only the datasource provider (sqlite -> postgresql). This keeps a
// single source of truth for the models: dev uses SQLite, production uses
// PostgreSQL, and the two can never drift.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const prismaDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'prisma');
const src = readFileSync(join(prismaDir, 'schema.prisma'), 'utf8');

if (!/datasource\s+db\s*\{[^}]*provider\s*=\s*"sqlite"/s.test(src)) {
  throw new Error('Expected the datasource provider to be "sqlite" in schema.prisma');
}

const out = src.replace(
  /(datasource\s+db\s*\{[^}]*?provider\s*=\s*)"sqlite"/s,
  '$1"postgresql"',
);

const banner = '// AUTO-GENERATED from schema.prisma by scripts/make-postgres-schema.mjs.\n// Do not edit directly — edit schema.prisma and regenerate.\n\n';
writeFileSync(join(prismaDir, 'schema.postgres.prisma'), banner + out);
console.log('Wrote prisma/schema.postgres.prisma (provider = postgresql)');
