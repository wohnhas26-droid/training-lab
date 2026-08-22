import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config, isStripeConfigured, isOriginAllowed } from './config.js';
import {
  helmetOptions,
  shouldTrustProxy,
  jsonBodyLimit,
  createApiRateLimiter,
  createAuthRateLimiter,
} from './middleware/security.js';
import authRoutes from './routes/auth.js';
import trainingRoutes from './routes/training.js';
import progressRoutes from './routes/progress.js';
import challengeRoutes from './routes/challenges.js';
import coachRoutes from './routes/coach.js';
import subscriptionRoutes from './routes/subscriptions.js';
import webhookRoutes from './routes/webhooks.js';
import catalogRoutes from './routes/catalog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticRoot = join(__dirname, '../..');

export function createApp() {
  const app = express();

  if (shouldTrustProxy()) {
    // Railway / Render / nginx sit in front of the process. Needed so
    // express-rate-limit keys on the client IP instead of the proxy.
    app.set('trust proxy', 1);
  }

  app.use(helmet(helmetOptions()));
  app.use(cors({
    origin(origin, callback) {
      callback(null, isOriginAllowed(origin));
    },
    credentials: true,
  }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'futbol-training-lab-api',
      version: '1.0.0',
      stripe: isStripeConfigured(),
    });
  });

  // Stripe needs the raw body. Mount before json() and outside rate limits so
  // webhook retries are never throttled.
  app.use('/api/webhooks', webhookRoutes);

  app.use('/api', createApiRateLimiter());
  app.use('/api/auth/login', createAuthRateLimiter());
  app.use('/api/auth/register', createAuthRateLimiter());

  app.use(express.json({ limit: jsonBodyLimit() }));
  app.use('/api/auth', authRoutes);
  app.use('/api/training', trainingRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/challenges', challengeRoutes);
  app.use('/api/coach', coachRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/catalog', catalogRoutes);

  if (config.nodeEnv === 'production') {
    app.use(express.static(staticRoot, { index: false }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(join(staticRoot, 'index.html'));
    });
  }

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
