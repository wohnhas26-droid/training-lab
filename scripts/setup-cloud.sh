#!/usr/bin/env bash
# Idempotent Cloud Agent / Linux setup for Futbol Training Lab.
# Installs dependencies, ensures a local backend env file, and prepares the
# SQLite database with demo data. Safe to run repeatedly.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing root dependencies"
npm install

echo "==> Installing backend dependencies"
npm --prefix backend install

if [ ! -f backend/.env ]; then
  echo "==> Creating backend/.env (local dev defaults)"
  cat > backend/.env <<'EOF'
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-change-in-production"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:8080"
EOF
fi

echo "==> Generating Prisma client, syncing schema, and seeding demo data"
npm --prefix backend run setup

echo "==> Setup complete"
