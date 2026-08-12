# Deployment Guide — Futbol Training Lab

## Prerequisites

- Domain name (optional for first deploy)
- Stripe account with live keys (when ready to charge)
- Server or cloud platform account

---

## Option A: Docker (recommended — VPS, Railway, DigitalOcean)

### 1. Prepare production `.env`

Copy `.env.example` to `.env` and set:

```env
JWT_SECRET="<generate-a-long-random-string>"
POSTGRES_PASSWORD="<a-strong-db-password>"
FRONTEND_URL="https://yourdomain.com"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PLAYER="price_..."
STRIPE_PRICE_ELITE="price_..."
STRIPE_PRICE_TEAM="price_..."
```

Generate JWT secret (PowerShell):
```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 2. Create live Stripe products

```powershell
# Use live secret key in .env first
npm run stripe:setup
```

### 3. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This starts three services: **PostgreSQL** (`db`, data in the `pg-data` volume),
the **API** (`api`, waits for the DB healthcheck, runs `prisma db push` on start),
and **nginx** (`frontend`). `JWT_SECRET` and `POSTGRES_PASSWORD` must be set in `.env`.

- **Frontend:** port 80 (nginx)
- **API:** port 3001 (internal, proxied via nginx at `/api`)
- **Database:** PostgreSQL (internal, persisted in the `pg-data` volume)

Point your domain DNS to the server. Add SSL with [Caddy](https://caddyserver.com/) or [Certbot](https://certbot.eff.org/) in front of port 80.

### 4. Register production webhook

```powershell
npm run stripe:webhooks -- https://yourdomain.com
```

Add the returned `whsec_...` to `.env` and restart:
```bash
docker compose -f docker-compose.prod.yml restart api
```

### 5. Seed demo data (first deploy only)

```bash
docker compose -f docker-compose.prod.yml exec api node prisma/seed.js
```

---

## Option B: Railway + PostgreSQL (recommended)

The root `Dockerfile` is a single service that serves the API **and** the static
frontend, and it now targets **PostgreSQL** (the Prisma schema for production is
generated from `schema.prisma` at build time — see `scripts/make-postgres-schema.mjs`).

1. Push repo to GitHub.
2. Railway → **New Project** → **Deploy from GitHub** → select the repo. Railway
   auto-detects the root `Dockerfile` (health check `/api/health` via `railway.toml`).
3. In the project, **+ New → Database → PostgreSQL**. Railway creates a `DATABASE_URL`.
4. On the app service → **Variables**, add:
   ```
   NODE_ENV=production
   JWT_SECRET=<long random string>        # required; app refuses to boot without a strong value
   FRONTEND_URL=https://<your-domain-or-railway-url>
   DATABASE_URL=${{Postgres.DATABASE_URL}}   # reference the Postgres plugin's variable
   # Stripe (optional): STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*
   ```
   Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`.
5. Deploy. The container runs `prisma db push` against Postgres on start (creates tables),
   then boots. Verify `https://<url>/api/health` → `{"status":"ok",...}`.
6. (Optional) Seed demo accounts once: Railway → service → **Shell** (or `railway run`):
   `node prisma/seed.js` (run from the image's `/app/backend`).

Data persists in the Postgres plugin across redeploys — no volume juggling needed.

---

## Option C: Render

1. Push to GitHub
2. **New Web Service** → connect repo → use `docker-compose.prod.yml`
3. Add env vars in Render dashboard
4. Set custom domain in Render settings

---

## Production checklist

- [ ] Strong `JWT_SECRET` set
- [ ] Live Stripe keys (not test)
- [ ] Live products/prices created (`npm run stripe:setup`)
- [ ] Webhook endpoint registered (`npm run stripe:webhooks`)
- [ ] Customer Portal activated (live mode)
- [ ] HTTPS enabled
- [ ] `FRONTEND_URL` matches your domain
- [ ] Stripe secret key rotated if ever exposed
- [ ] Terms of Service + Privacy Policy pages linked

---

## Architecture

```
Browser → nginx (:80) → static HTML/JS/CSS
                      → /api/* → Express API (:3001)
                                      → PostgreSQL (db:5432)
                                      → Stripe API
```

The frontend auto-detects the API: uses `/api` on production domains, `localhost:3001` locally.

---

## Updating production

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Checkout fails | Verify `STRIPE_PRICE_*` env vars and API version |
| `"stripe": false` in health | Check `STRIPE_SECRET_KEY` and price IDs in env |
| Webhooks not syncing | Verify `STRIPE_WEBHOOK_SECRET` and endpoint URL |
| CORS errors | Set `FRONTEND_URL` to exact domain (with https) |

See also: [docs/WEBHOOKS.md](WEBHOOKS.md) · [docs/STRIPE.md](STRIPE.md)
