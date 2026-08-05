/**
 * Creates Stripe products and prices for Futbol Training Lab.
 * Run: npm run stripe:setup
 *
 * Requires STRIPE_SECRET_KEY in .env (root or backend/.env)
 */
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../.env') });

const PLANS = [
  { id: 'player', name: 'Player Membership', amount: 2999, description: 'Daily guided training, progress tracking, challenges' },
  { id: 'elite', name: 'Elite Membership', amount: 5999, description: 'AI plans, video assessments, personalized feedback' },
  { id: 'team', name: 'Team Membership', amount: 19900, description: 'Unlimited players, coach dashboard, team tools' },
];

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey?.startsWith('sk_')) {
    console.error('Set STRIPE_SECRET_KEY in .env before running this script.');
    console.error('Get test keys from: https://dashboard.stripe.com/test/apikeys');
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);
  const priceIds = {};

  console.log('Creating Stripe products and prices...\n');

  for (const plan of PLANS) {
    const product = await stripe.products.create({
      name: `Futbol Training Lab — ${plan.name}`,
      description: plan.description,
      metadata: { planId: plan.id },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { planId: plan.id },
    });

    priceIds[plan.id] = price.id;
    console.log(`✓ ${plan.name}`);
    console.log(`  Product: ${product.id}`);
    console.log(`  Price:   ${price.id} ($${plan.amount / 100}/mo)\n`);
  }

  updateEnvFile(join(__dirname, '../../.env'), priceIds);
  updateEnvFile(join(__dirname, '../.env'), priceIds);

  console.log('Done! Price IDs written to .env');
  console.log('\nNext steps:');
  console.log('1. Add STRIPE_PUBLISHABLE_KEY to .env');
  console.log('2. Start webhook forwarding:');
  console.log('   stripe listen --forward-to localhost:3001/api/webhooks/stripe');
  console.log('3. Copy the webhook signing secret to STRIPE_WEBHOOK_SECRET in .env');
  console.log('4. Restart the API server');
}

function updateEnvFile(envPath, priceIds) {
  if (!existsSync(envPath)) {
    writeFileSync(envPath, buildEnvBlock(priceIds));
    return;
  }

  let content = readFileSync(envPath, 'utf-8');
  const vars = {
    STRIPE_PRICE_PLAYER: priceIds.player,
    STRIPE_PRICE_ELITE: priceIds.elite,
    STRIPE_PRICE_TEAM: priceIds.team,
  };

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}="${value}"`);
    } else {
      content += `\n${key}="${value}"`;
    }
  }

  writeFileSync(envPath, content);
}

function buildEnvBlock(priceIds) {
  return Object.entries({
    STRIPE_PRICE_PLAYER: priceIds.player,
    STRIPE_PRICE_ELITE: priceIds.elite,
    STRIPE_PRICE_TEAM: priceIds.team,
  }).map(([k, v]) => `${k}="${v}"`).join('\n') + '\n';
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
