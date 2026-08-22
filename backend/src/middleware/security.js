import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export function shouldTrustProxy(nodeEnv = config.nodeEnv) {
  return nodeEnv === 'production' || process.env.TRUST_PROXY === '1';
}

export function jsonBodyLimit() {
  return process.env.JSON_BODY_LIMIT || '100kb';
}

export function rateLimitWindowMs() {
  const parsed = Number(process.env.RATE_LIMIT_WINDOW_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : FIFTEEN_MINUTES;
}

export function apiRateLimitMax() {
  const parsed = Number(process.env.RATE_LIMIT_API_MAX);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 600;
}

export function authRateLimitMax() {
  const parsed = Number(process.env.RATE_LIMIT_AUTH_MAX);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

/**
 * Helmet options that work for this app: Express serves the vanilla-JS
 * frontend in production (inline styles + inline module scripts) and JSON
 * for the native Capacitor webview. CSP allows those while still blocking
 * framing, plugins, and unexpected script origins.
 */
export function helmetOptions({ nodeEnv = config.nodeEnv } = {}) {
  return {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", 'https://api.stripe.com', 'https://checkout.stripe.com'],
        mediaSrc: ["'self'", 'https:', 'blob:'],
        frameSrc: [
          "'self'",
          'https://js.stripe.com',
          'https://hooks.stripe.com',
          'https://checkout.stripe.com',
          'https://www.youtube-nocookie.com',
          'https://www.youtube.com',
          'https://player.vimeo.com',
        ],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'", 'https://checkout.stripe.com'],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: nodeEnv === 'production' ? [] : null,
      },
    },
    // API is consumed cross-origin by the local frontend (port 8080) and the
    // Capacitor webview (capacitor://localhost). CORS still gates who can call us.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: nodeEnv === 'production'
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
  };
}

export function shouldSkipRateLimit(req) {
  const path = req.path || '';
  const originalUrl = req.originalUrl || '';
  return isHealthPath(path, originalUrl) || isWebhookPath(path, originalUrl);
}

function isHealthPath(path, originalUrl) {
  return path === '/health'
    || path === '/api/health'
    || originalUrl.startsWith('/api/health');
}

function isWebhookPath(path, originalUrl) {
  return path.startsWith('/webhooks')
    || path.startsWith('/api/webhooks')
    || originalUrl.startsWith('/api/webhooks');
}

export function createApiRateLimiter(overrides = {}) {
  return rateLimit({
    windowMs: rateLimitWindowMs(),
    limit: apiRateLimitMax(),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
    message: { error: 'Too many requests. Please try again later.' },
    ...overrides,
  });
}

export function createAuthRateLimiter(overrides = {}) {
  return rateLimit({
    windowMs: rateLimitWindowMs(),
    limit: authRateLimitMax(),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' },
    ...overrides,
  });
}
