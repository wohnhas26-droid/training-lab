/**
 * Register Stripe webhook endpoint for production.
 * Run: npm run stripe:webhooks -- --url https://yourdomain.com
 */
import Stripe from 'stripe';
import '../src/loadEnv.js';

const webhookUrl = process.argv.find(a => a.startsWith('http')) || process.argv[2];

if (!webhookUrl) {
  console.error('Usage: npm run stripe:webhooks -- https://yourdomain.com');
  console.error('Creates endpoint: https://yourdomain.com/api/webhooks/stripe');
  process.exit(1);
}

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey?.startsWith('sk_')) {
  console.error('Set STRIPE_SECRET_KEY in .env first.');
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: '2025-03-31.basil' });
const endpoint = `${webhookUrl.replace(/\/$/, '')}/api/webhooks/stripe`;

const events = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
];

async function main() {
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const match = existing.data.find(e => e.url === endpoint);

  if (match) {
    console.log('Webhook endpoint already exists:');
    console.log(`  ID:  ${match.id}`);
    console.log(`  URL: ${match.url}`);
    console.log('\nCopy the signing secret from Stripe Dashboard → Developers → Webhooks');
    console.log('Or delete and recreate to get a new secret.');
    return;
  }

  const endpointObj = await stripe.webhookEndpoints.create({
    url: endpoint,
    enabled_events: events,
    description: 'Futbol Training Lab production',
  });

  console.log('Webhook endpoint created!');
  console.log(`  URL: ${endpointObj.url}`);
  console.log(`  ID:  ${endpointObj.id}`);
  console.log('\nIMPORTANT: Add the signing secret to your production .env:');
  console.log(`  STRIPE_WEBHOOK_SECRET="${endpointObj.secret}"`);
  console.log('\nEvents:', events.join(', '));
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
