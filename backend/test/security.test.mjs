import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import helmet from 'helmet';
import {
  helmetOptions,
  shouldTrustProxy,
  shouldSkipRateLimit,
  jsonBodyLimit,
  apiRateLimitMax,
  authRateLimitMax,
  createApiRateLimiter,
  createAuthRateLimiter,
} from '../src/middleware/security.js';

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        port,
        close: () => new Promise((done, fail) => {
          server.close((err) => (err ? fail(err) : done()));
        }),
      });
    });
    server.on('error', reject);
  });
}

test('production trusts the first proxy; development does not', () => {
  assert.equal(shouldTrustProxy('production'), true);
  assert.equal(shouldTrustProxy('development'), false);
});

test('JSON body limit defaults to 100kb', () => {
  assert.equal(jsonBodyLimit(), '100kb');
});

test('rate limit defaults are generous for the SPA and strict for auth', () => {
  assert.equal(apiRateLimitMax(), 600);
  assert.equal(authRateLimitMax(), 10);
});

test('helmet production options enable HSTS, deny framing, and allow inline UI', () => {
  const opts = helmetOptions({ nodeEnv: 'production' });
  assert.equal(opts.crossOriginEmbedderPolicy, false);
  assert.deepEqual(opts.crossOriginResourcePolicy, { policy: 'cross-origin' });
  assert.deepEqual(opts.frameguard, { action: 'deny' });
  assert.equal(opts.hsts.maxAge, 31536000);
  assert.ok(opts.contentSecurityPolicy.directives.scriptSrc.includes("'unsafe-inline'"));
  assert.ok(opts.contentSecurityPolicy.directives.styleSrc.includes("'unsafe-inline'"));
  assert.deepEqual(opts.contentSecurityPolicy.directives.objectSrc, ["'none'"]);
  assert.ok(opts.contentSecurityPolicy.directives.frameSrc.includes('https://www.youtube-nocookie.com'));
  assert.ok(opts.contentSecurityPolicy.directives.mediaSrc.includes('https:'));
  assert.deepEqual(opts.contentSecurityPolicy.directives.upgradeInsecureRequests, []);
});

test('helmet development options disable HSTS and upgrade-insecure-requests', () => {
  const opts = helmetOptions({ nodeEnv: 'development' });
  assert.equal(opts.hsts, false);
  assert.equal(opts.contentSecurityPolicy.directives.upgradeInsecureRequests, null);
});

test('shouldSkipRateLimit skips health and Stripe webhooks only', () => {
  assert.equal(shouldSkipRateLimit({ path: '/health', originalUrl: '/api/health' }), true);
  assert.equal(shouldSkipRateLimit({ path: '/api/health', originalUrl: '/api/health' }), true);
  assert.equal(shouldSkipRateLimit({ path: '/webhooks/stripe', originalUrl: '/api/webhooks/stripe' }), true);
  assert.equal(shouldSkipRateLimit({ path: '/api/webhooks/stripe', originalUrl: '/api/webhooks/stripe' }), true);
  assert.equal(shouldSkipRateLimit({ path: '/auth/login', originalUrl: '/api/auth/login' }), false);
  assert.equal(shouldSkipRateLimit({ path: '/training/today', originalUrl: '/api/training/today' }), false);
});

test('helmet sets security headers and hides X-Powered-By', async () => {
  const app = express();
  app.use(helmet(helmetOptions({ nodeEnv: 'production' })));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  const server = await listen(app);
  try {
    const res = await fetch(`http://127.0.0.1:${server.port}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('cross-origin-resource-policy'), 'cross-origin');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    const csp = res.headers.get('content-security-policy') || '';
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /frame-ancestors 'none'/);
  } finally {
    await server.close();
  }
});

test('auth limiter returns 429 after the configured max attempts', async () => {
  const app = express();
  app.use('/api/auth/login', createAuthRateLimiter({
    windowMs: 60_000,
    limit: 3,
    validate: false,
  }));
  app.post('/api/auth/login', (_req, res) => res.json({ ok: true }));

  const server = await listen(app);
  try {
    const url = `http://127.0.0.1:${server.port}/api/auth/login`;
    for (let i = 0; i < 3; i += 1) {
      const res = await fetch(url, { method: 'POST' });
      assert.equal(res.status, 200);
    }
    const blocked = await fetch(url, { method: 'POST' });
    assert.equal(blocked.status, 429);
    const body = await blocked.json();
    assert.match(body.error, /Too many login attempts/i);
    const retryAfter = blocked.headers.get('retry-after');
    const combined = blocked.headers.get('ratelimit');
    assert.ok(retryAfter || combined, 'expected Retry-After or RateLimit headers');
  } finally {
    await server.close();
  }
});

test('API limiter skips /api/health so uptime checks are never throttled', async () => {
  const app = express();
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', createApiRateLimiter({
    windowMs: 60_000,
    limit: 1,
    validate: false,
  }));
  app.get('/api/catalog/exercises', (_req, res) => res.json({ ok: true }));

  const server = await listen(app);
  try {
    const health = `http://127.0.0.1:${server.port}/api/health`;
    assert.equal((await fetch(health)).status, 200);
    assert.equal((await fetch(health)).status, 200);

    const catalog = `http://127.0.0.1:${server.port}/api/catalog/exercises`;
    assert.equal((await fetch(catalog)).status, 200);
    const throttled = await fetch(catalog);
    assert.equal(throttled.status, 429);
    const body = await throttled.json();
    assert.match(body.error, /Too many requests/i);
  } finally {
    await server.close();
  }
});
