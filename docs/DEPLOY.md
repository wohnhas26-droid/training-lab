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

- **Frontend:** port 80 (nginx)
- **API:** port 3001 (internal, proxied via nginx at `/api`)

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

## Option B: Railway

1. Push repo to GitHub
2. Create Railway project → **Deploy from GitHub**
3. Add **Dockerfile** service using `backend/Dockerfile`
4. Set environment variables from `.env.example`
5. Deploy static frontend separately OR use docker-compose on Railway

For a single-service deploy, use Docker Compose plugin on Railway.

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
                                      → SQLite (/data/prod.db)
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
| 429 on login | Auth is limited to 10 attempts / 15 min per IP; wait or raise `RATE_LIMIT_AUTH_MAX` |
| Rate limits hit every user | Production sets `trust proxy`; do not disable it behind Railway/nginx |

See also: [docs/WEBHOOKS.md](WEBHOOKS.md) · [docs/STRIPE.md](STRIPE.md)
