# Webhooks Setup — Futbol Training Lab

Webhooks keep subscription status in sync when users pay, cancel, or fail payment.

---

## Local development

### 1. Install Stripe CLI

https://stripe.com/docs/stripe-cli#install

### 2. Forward events to your API

```powershell
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

### 3. Copy the signing secret

The CLI prints:
```
Ready! Your webhook signing secret is whsec_...
```

Add to `.env`:
```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Restart the API

```powershell
npm run dev
```

### 5. Test a webhook

In another terminal:
```powershell
stripe trigger checkout.session.completed
```

---

## Production

### Option 1: Automated script

```powershell
npm run stripe:webhooks -- https://yourdomain.com
```

This creates the endpoint at `https://yourdomain.com/api/webhooks/stripe` and prints the signing secret.

Add to production `.env` and restart the API.

### Option 2: Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. **Add endpoint**
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET` in `.env`

---

## Events handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activates subscription after payment |
| `customer.subscription.updated` | Syncs plan/status changes |
| `customer.subscription.deleted` | Marks subscription canceled |
| `invoice.paid` | Confirms active billing |
| `invoice.payment_failed` | Marks subscription past due |

---

## Verify webhooks work

1. Complete a test checkout on your site
2. Check Stripe Dashboard → **Developers → Webhooks → your endpoint → Events**
3. Confirm your user's subscription status updated in the app (Profile page)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Webhook Error: No signatures found` | Wrong `STRIPE_WEBHOOK_SECRET` — use secret from the exact endpoint |
| 400 on webhook | API must receive raw body — already configured in `webhooks.js` |
| Events not arriving locally | Ensure `stripe listen` is running and API is on :3001 |
| Events not arriving in prod | Check HTTPS, firewall, and endpoint URL matches deploy domain |
