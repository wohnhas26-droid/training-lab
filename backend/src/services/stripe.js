import Stripe from 'stripe';
import { config, PLAN_CONFIG, isStripeConfigured } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { buildCheckoutReturnUrls, normalizeCheckoutClient } from './checkoutUrls.js';

export { buildCheckoutReturnUrls, normalizeCheckoutClient } from './checkoutUrls.js';

let stripe = null;

export function getStripe() {
  if (!config.stripe.secretKey?.startsWith('sk_')) return null;
  if (!stripe) {
    stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2025-03-31.basil',
    });
  }
  return stripe;
}

export { isStripeConfigured, PLAN_CONFIG };

async function ensureCustomer(user) {
  const s = getStripe();
  if (!s) throw new Error('Stripe not configured');

  let customerId = user.subscription?.stripeCustomerId;
  if (customerId) return customerId;

  const customer = await s.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: user.subscription?.plan || 'player',
      stripeCustomerId: customer.id,
      status: 'trialing',
    },
    update: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

function checkoutUrlsFor(plan, client) {
  return buildCheckoutReturnUrls({
    frontendUrl: config.frontendUrl,
    scheme: config.appDeepLinkScheme,
    plan,
    client: normalizeCheckoutClient(client),
  });
}

export async function createCheckoutSession(userId, plan, options = {}) {
  const urls = checkoutUrlsFor(plan, options.client);
  const s = getStripe();
  if (!s) {
    return {
      demo: true,
      url: urls.demoSuccessUrl,
      message: 'Stripe not configured — demo mode active',
    };
  }

  const planConfig = PLAN_CONFIG[plan];
  if (!planConfig) throw new Error(`Invalid plan: ${plan}`);

  const priceId = config.stripe.prices[plan];
  if (!priceId) {
    throw new Error(`No Stripe price configured for plan "${plan}". Run: npm run stripe:setup`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  if (!user) throw new Error('User not found');

  const customerId = await ensureCustomer(user);
  const successUrl = options.successPath
    ? `${config.frontendUrl}${options.successPath}&session_id={CHECKOUT_SESSION_ID}`
    : urls.successUrl;
  const cancelUrl = options.cancelPath
    ? `${config.frontendUrl}${options.cancelPath}`
    : urls.cancelUrl;

  const session = await s.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    subscription_data: {
      trial_period_days: planConfig.trialDays,
      metadata: { userId, plan },
    },
    metadata: { userId, plan },
  });

  return { url: session.url, sessionId: session.id };
}

export async function createPortalSession(userId, options = {}) {
  const s = getStripe();
  if (!s) throw new Error('Stripe not configured');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  if (!user) throw new Error('User not found');

  const customerId = user.subscription?.stripeCustomerId || await ensureCustomer(user);
  if (!customerId) throw new Error('No billing account found');

  const urls = checkoutUrlsFor('player', options.client);
  const session = await s.billingPortal.sessions.create({
    customer: customerId,
    return_url: urls.portalReturnUrl,
  });

  return { url: session.url };
}

export async function verifyCheckoutSession(sessionId, userId) {
  const s = getStripe();
  if (!s) return null;

  const session = await s.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  if (session.metadata?.userId !== userId) {
    throw new Error('Session does not belong to this user');
  }

  if (session.payment_status === 'paid' || session.status === 'complete') {
    await syncSubscriptionFromStripe(session.subscription, session.metadata?.plan, session.customer);
  }

  return {
    plan: session.metadata?.plan,
    status: session.payment_status,
    customerId: session.customer,
  };
}

export async function syncSubscriptionFromStripe(stripeSubscription, planOverride, customerId) {
  const sub = typeof stripeSubscription === 'string'
    ? await getStripe().subscriptions.retrieve(stripeSubscription)
    : stripeSubscription;

  const userId = sub.metadata?.userId;
  if (!userId) {
    const existing = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: sub.id },
    });
    if (!existing) return null;
    return updateSubscriptionRecord(existing.userId, sub, planOverride, customerId);
  }

  return updateSubscriptionRecord(userId, sub, planOverride || sub.metadata?.plan, customerId);
}

async function updateSubscriptionRecord(userId, sub, plan, customerId) {
  const statusMap = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    paused: 'canceled',
  };

  const planId = plan || sub.metadata?.plan || 'player';
  const status = statusMap[sub.status] || 'canceled';

  return prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: planId,
      status,
      stripeCustomerId: customerId || sub.customer,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null,
    },
    update: {
      plan: planId,
      status,
      stripeCustomerId: customerId || sub.customer,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null,
    },
  });
}

export async function handleWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode === 'subscription' && session.subscription) {
        await syncSubscriptionFromStripe(
          session.subscription,
          session.metadata?.plan,
          session.customer,
        );
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      await syncSubscriptionFromStripe(sub);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const existing = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: { status: 'canceled' },
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: invoice.subscription },
        });
        if (existing) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: { status: 'past_due' },
          });
        }
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await syncSubscriptionFromStripe(invoice.subscription);
      }
      break;
    }

    default:
      break;
  }
}

export async function getPublicStripeConfig() {
  return {
    configured: isStripeConfigured(),
    publishableKey: config.stripe.publishableKey || null,
    deepLinkScheme: config.appDeepLinkScheme,
    plans: Object.entries(PLAN_CONFIG).map(([id, plan]) => ({
      id,
      name: plan.name,
      amount: plan.amount,
      priceConfigured: Boolean(config.stripe.prices[id]),
    })),
  };
}
