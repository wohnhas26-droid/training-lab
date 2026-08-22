# Stripe Integration — Futbol Training Lab

## Quick Setup (Test Mode)

### 1. Get API keys

1. Create a free account at [stripe.com](https://stripe.com)
2. Open [Test API Keys](https://dashboard.stripe.com/test/apikeys)
3. Copy **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`)

### 2. Configure environment

Copy `.env.example` to `.env` in the project root and add your keys:

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 3. Create products and prices

This script creates all 4 subscription products in Stripe and writes price IDs to `.env`:

```powershell
cd C:\Users\Ryan\training-lab
npm run stripe:setup
```

### 4. Set up webhooks (local dev)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then:

```powershell
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

Copy the webhook signing secret (`whsec_...`) to `.env`:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Restart the API server after updating `.env`.

### 5. Enable Customer Portal

1. Go to [Stripe Customer Portal Settings](https://dashboard.stripe.com/test/settings/billing/portal)
2. Click **Activate test link**
3. Enable: cancel subscription, update payment method, view invoices

### 6. Test the flow

1. Start the app: `npm run dev`
2. Sign up or log in at http://localhost:8080
3. Go to **Pricing** → click **Subscribe** on any plan
4. Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
5. After payment, you'll land on `/subscription/success.html`
6. On **Profile**, click **Manage Billing** to open the Stripe portal

---

## Subscription Plans

| Plan | Price | Stripe env var |
|------|-------|----------------|
| Player | $29.99/mo | `STRIPE_PRICE_PLAYER` |
| Elite | $59.99/mo | `STRIPE_PRICE_ELITE` |
| Team | $199/mo | `STRIPE_PRICE_TEAM` |

All plans include a **7-day free trial**.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subscriptions/config` | Stripe config status (public) |
| POST | `/api/subscriptions/checkout` | Create Checkout session (auth required). Body: `{ plan, client? }` where `client` is `web` (default) or `native` |
| POST | `/api/subscriptions/portal` | Open billing portal (auth required) |
| GET | `/api/subscriptions/verify?session_id=` | Verify checkout after redirect |
| GET | `/api/subscriptions/status` | Current subscription status |
| POST | `/api/webhooks/stripe` | Stripe webhook receiver |

---

## Webhook Events Handled

- `checkout.session.completed` — activates subscription after payment
- `customer.subscription.created` / `updated` — syncs plan and status
- `customer.subscription.deleted` — marks subscription canceled
- `invoice.paid` — confirms active billing
- `invoice.payment_failed` — marks subscription past due

---

## Production Checklist

- [ ] Switch to **live** API keys (`sk_live_...`, `pk_live_...`)
- [ ] Create live products/prices (`npm run stripe:setup` with live key)
- [ ] Register production webhook URL: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Activate live Customer Portal
- [ ] Set `FRONTEND_URL` to your production domain
- [ ] Native checkout: API returns `traininglab://` success/cancel URLs when `client` is `native` (`APP_DEEP_LINK_SCHEME`)
- [ ] Test full signup → checkout → webhook → dashboard flow

---

## Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 3220` | 3D Secure required |

More: [Stripe test cards](https://docs.stripe.com/testing#cards)
