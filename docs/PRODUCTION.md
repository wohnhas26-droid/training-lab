# Production setup — www.futbol-training-lab.com

## Current status

| Item | Status |
|------|--------|
| Domain | Live on **Webador** (marketing placeholder) |
| App deploy | **Not deployed** — `/api/health` returns 404 |
| Stripe webhook | Registered in Stripe (test mode) |
| GitHub repo | https://github.com/wohnhas26-droid/training-lab |

Webador cannot run the Node.js API. You need to deploy the app to Railway, Render, or a VPS, then point your domain DNS to that host.

---

## Production environment variables

Create these on your hosting platform (do not commit to git):

```env
NODE_ENV=production
JWT_SECRET="<generate-a-long-random-string>"
FRONTEND_URL="https://www.futbol-training-lab.com"
PORT=3001
DATABASE_URL="file:/data/prod.db"

# Test keys for now — switch to sk_live_/pk_live_ when ready to charge
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

STRIPE_PRICE_PLAYER="price_..."
STRIPE_PRICE_ELITE="price_..."
STRIPE_PRICE_TEAM="price_..."
```

> **Never commit real secrets.** Set these only in your host's environment
> variables / secret manager. A previous revision of this file contained a real
> `STRIPE_WEBHOOK_SECRET` — if that value was ever live, rotate it in the Stripe
> Dashboard (Developers → Webhooks → roll the signing secret).

Webhook endpoint (already created in Stripe):
`https://www.futbol-training-lab.com/api/webhooks/stripe`

---

## Recommended: Deploy on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select `wohnhas26-droid/training-lab`
3. Railway auto-detects the root **`Dockerfile`** (single service — API + static site)
4. In **Variables**, add all env vars from the section above (do not rely on `.env` — it is not in git)
5. Deploy → open the `*.up.railway.app` URL → test `/api/health`
6. **Settings → Domains** → add `www.futbol-training-lab.com`
7. Update DNS at your registrar (replace Webador records):

   | Type | Name | Value |
   |------|------|-------|
   | CNAME | www | `<railway-provided-hostname>` |
   | A or CNAME | @ | per Railway/docs for apex |

8. Wait for SSL, then verify:
   - https://www.futbol-training-lab.com/api/health
   - Complete a test checkout

---

## DNS: moving off Webador

Your domain currently serves a Webador page. To use the full app:

1. Remove or disable Webador DNS / site connection for this domain
2. Point DNS to Railway/Render/VPS instead
3. Keep the Stripe webhook URL unchanged — it already matches your domain

---

## Go live with real payments

1. Switch Stripe to **live mode** in Dashboard
2. Regenerate keys → update env vars
3. Run `npm run stripe:setup` with live keys (creates live price IDs)
4. Run `npm run stripe:webhooks -- https://www.futbol-training-lab.com` with live keys
5. Activate Customer Portal in Stripe (live mode)
6. Add Terms of Service + Privacy Policy pages

---

### If deploy shows "Crashed"

| Cause | Fix |
|-------|-----|
| Missing env vars | Add all variables in Railway **Variables** tab |
| Wrong builder | Ensure it uses root `Dockerfile`, not Docker Compose |
| Old commit | Push latest code from GitHub — includes `railway.toml` |
| Health check fails | Open **Deploy Logs** — look for Prisma or Stripe errors |

---

## Verify webhooks after deploy

1. Stripe Dashboard → Developers → Webhooks → your endpoint
2. Send test event or complete checkout
3. Confirm events show **200** responses
4. Check user subscription updates in the app Profile page

See also: [DEPLOY.md](DEPLOY.md) · [WEBHOOKS.md](WEBHOOKS.md)
