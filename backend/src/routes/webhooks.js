import { Router } from 'express';
import express from 'express';
import { handleWebhookEvent } from '../services/stripe.js';
import { config } from '../config.js';
import { getStripe } from '../services/stripe.js';

const router = Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
});

export default router;
