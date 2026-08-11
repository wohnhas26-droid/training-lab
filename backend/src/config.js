export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
  nodeEnv: process.env.NODE_ENV || 'development',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    prices: {
      player: process.env.STRIPE_PRICE_PLAYER,
      elite: process.env.STRIPE_PRICE_ELITE,
      team: process.env.STRIPE_PRICE_TEAM,
    },
  },
  openaiApiKey: process.env.OPENAI_API_KEY,
};

export const PLAN_CONFIG = {
  player: {
    name: 'Player Membership',
    amount: 2999,
    role: 'player',
    trialDays: 7,
  },
  elite: {
    name: 'Elite Membership',
    amount: 5999,
    role: 'player',
    trialDays: 7,
  },
  team: {
    name: 'Team Membership',
    amount: 19900,
    role: 'coach',
    trialDays: 7,
  },
};

export function isStripeConfigured() {
  const { secretKey, prices } = config.stripe;
  return Boolean(secretKey && secretKey.startsWith('sk_') && Object.values(prices).some(Boolean));
}

// Origins used by the Capacitor native app webview. The app authenticates with
// a bearer token (not cookies), so these must be allowed by CORS in production.
export const NATIVE_ORIGINS = [
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
  'ionic://localhost',
];

export function isOriginAllowed(origin, { frontendUrl = config.frontendUrl, nodeEnv = config.nodeEnv } = {}) {
  // Non-browser clients (curl, native fetch without an Origin) send no Origin.
  if (!origin) return true;
  const allowed = new Set([frontendUrl, ...NATIVE_ORIGINS].filter(Boolean));
  if (allowed.has(origin)) return true;
  // Be permissive in development to ease local testing across ports/hosts.
  return nodeEnv === 'development';
}
