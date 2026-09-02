import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  createCheckoutSession,
  createPortalSession,
  verifyCheckoutSession,
  getPublicStripeConfig,
  isStripeConfigured,
  PLAN_CONFIG,
} from '../services/stripe.js';
import { prisma } from '../lib/prisma.js';
import { getUserState } from '../lib/prisma.js';
import { planAllowedForRole, alreadyOnPlan, hasActiveOtherPlan } from '../config.js';

const router = Router();

router.get('/config', async (_req, res) => {
  res.json(await getPublicStripeConfig());
});

router.get('/plans', (_req, res) => {
  res.json(
    Object.entries(PLAN_CONFIG).map(([id, plan]) => ({
      id,
      name: plan.name,
      price: plan.amount / 100,
      trialDays: plan.trialDays,
      role: plan.role,
    })),
  );
});

router.post('/checkout', authRequired, async (req, res) => {
  const { plan, client } = req.body;
  if (!PLAN_CONFIG[plan]) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { subscription: true },
    });
    if (!planAllowedForRole(user?.role, plan)) {
      return res.status(400).json({ error: 'That plan is not available for this account' });
    }
    if (alreadyOnPlan(user?.subscription, plan)) {
      return res.status(400).json({ error: 'You\'re already on this plan' });
    }
    if (hasActiveOtherPlan(user?.subscription, plan)) {
      return res.status(400).json({ error: 'Use Manage Billing to switch plans' });
    }
    const result = await createCheckoutSession(req.userId, plan, {
      role: user?.role,
      client,
    });
    res.json(result);
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
});

router.post('/portal', authRequired, async (req, res) => {
  if (!isStripeConfigured()) {
    return res.status(503).json({ error: 'Stripe billing portal not configured' });
  }

  try {
    const result = await createPortalSession(req.userId, { client: req.body?.client });
    res.json(result);
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: err.message || 'Failed to open billing portal' });
  }
});

router.get('/verify', authRequired, async (req, res) => {
  const { session_id: sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'session_id required' });
  }

  try {
    await verifyCheckoutSession(sessionId, req.userId);
    const state = await getUserState(req.userId);
    res.json(state);
  } catch (err) {
    console.error('Verify error:', err);
    res.status(400).json({ error: err.message || 'Could not verify checkout session' });
  }
});

router.get('/status', authRequired, async (req, res) => {
  const sub = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  res.json({
    plan: sub?.plan || 'player',
    status: sub?.status || 'trialing',
    currentPeriodEnd: sub?.currentPeriodEnd || null,
    hasBillingAccount: Boolean(sub?.stripeCustomerId),
    stripeConfigured: isStripeConfigured(),
  });
});

export default router;
