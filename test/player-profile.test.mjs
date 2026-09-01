import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../js/components/ui.js';
import { renderProfileCard, renderSubscriptionCard, billingPortalHref, BILLING_PORTAL_UNAVAILABLE } from '../js/components/playerProfile.js';

const helpers = { escapeHtml };

test('profile card escapes name, email, goals, and equipment', () => {
  const html = renderProfileCard(
    { name: 'Alex <Rivera>', email: 'a<@test.com' },
    {
      age: 15,
      position: 'midfielder',
      skillLevel: 'intermediate',
      trainingDays: 5,
      goals: ['passing', '<touch>'],
      equipment: ['ball', 'cones<script>'],
    },
    helpers,
  );
  assert.match(html, /Alex &lt;Rivera&gt;/);
  assert.match(html, /a&lt;@test.com/);
  assert.match(html, /&lt;Touch&gt;/);
  assert.match(html, /Cones&lt;script&gt;/);
  assert.match(html, /Midfielder/);
  assert.doesNotMatch(html, /<touch>/);
  assert.doesNotMatch(html, /<script>/);
});

test('profile card title-cases underscored position and skill tokens', () => {
  const html = renderProfileCard(
    { name: 'Alex', email: 'a@test.com' },
    { position: 'attacking_midfielder', skillLevel: 'intermediate' },
    helpers,
  );
  assert.match(html, /Position:<\/span> Attacking Midfielder/);
  assert.match(html, /Skill Level:<\/span> Intermediate/);
  assert.doesNotMatch(html, /attacking_midfielder/);
});

test('profile card shows humanized improvement areas, goals, and equipment', () => {
  const html = renderProfileCard(
    { name: 'Alex', email: 'a@test.com' },
    {
      goals: ['passing', 'first touch'],
      improvementAreas: ['ball_mastery', 'passing'],
      equipment: ['ball', 'cones', 'wall'],
    },
    helpers,
  );
  assert.match(html, /Goals:<\/span> Passing, First Touch/);
  assert.match(html, /Improvement Areas:<\/span> Ball Mastery, Passing/);
  assert.match(html, /Equipment:<\/span> Ball, Cones, Wall/);
  assert.doesNotMatch(html, /ball_mastery/);
  assert.doesNotMatch(html, />ball, cones/);
});

test('empty profile lists show an em dash instead of leftover copy', () => {
  const html = renderProfileCard({ name: 'Alex', email: 'a@test.com' }, {}, helpers);
  assert.match(html, /Goals:<\/span> —/);
  assert.match(html, /Improvement Areas:<\/span> —/);
  assert.match(html, /Equipment:<\/span> —/);
});

test('subscription card uses known plan names and escapes unknown plans', () => {
  const elite = renderSubscriptionCard({ plan: 'elite', status: 'active' }, helpers);
  assert.match(elite, /Elite Membership/);
  assert.match(elite, /Monthly Evaluations/);
  assert.doesNotMatch(elite, /Personalized Training/);
  assert.doesNotMatch(elite, /AI Personal Training/);
  assert.match(elite, />Active</);

  const player = renderSubscriptionCard({ plan: 'player', status: 'active' }, helpers);
  assert.match(player, /Player Membership/);
  assert.doesNotMatch(player, /Monthly Evaluations/);
  assert.doesNotMatch(player, /Personalized Training/);
  assert.doesNotMatch(player, /AI Personal Training/);

  const unknown = renderSubscriptionCard({ plan: 'gold<script>', status: 'trialing' }, helpers);
  assert.match(unknown, /gold&lt;script&gt;/);
  assert.doesNotMatch(unknown, /gold<script>/);
  assert.match(unknown, />Demo</);
  assert.doesNotMatch(unknown, /Free Trial/);
});

test('subscription card shows Free Trial only when Stripe is configured', () => {
  const demo = renderSubscriptionCard({ plan: 'player', status: 'trialing', stripeConfigured: false }, helpers);
  assert.match(demo, />Demo</);
  assert.doesNotMatch(demo, /Free Trial/);

  const trial = renderSubscriptionCard({ plan: 'player', status: 'trialing', stripeConfigured: true }, helpers);
  assert.match(trial, /Free Trial/);
  assert.doesNotMatch(trial, />Demo</);

  const activeOffline = renderSubscriptionCard({ plan: 'player', status: 'active', stripeConfigured: false }, helpers);
  assert.match(activeOffline, />Active</);
  assert.doesNotMatch(activeOffline, /Free Trial/);
});

test('profile regenerate copy does not claim an AI plan', () => {
  const html = readFileSync(new URL('../player/profile.html', import.meta.url), 'utf8');
  assert.match(html, /rebuild your 4-week development plan/);
  assert.doesNotMatch(html, /AI development plan/);
  assert.doesNotMatch(html, /4-week AI/);
});

test('profile edit form shows title-cased improvement areas, not leftover lowercase phrases', () => {
  const html = readFileSync(new URL('../player/profile.html', import.meta.url), 'utf8');
  assert.match(html, /placeholder="Ball Mastery, Passing"/);
  assert.doesNotMatch(html, /placeholder="ball mastery, passing"/);
  assert.doesNotMatch(html, /ball_mastery, passing/);
  assert.match(html, /focusListToCsv\(profile\.improvementAreas\)/);
  assert.match(html, /csvToCategoryIds\(fd\.get\('improvementAreas'\)\)/);
});

test('profile edit form shows title-cased goals, not leftover lowercase phrases', () => {
  const html = readFileSync(new URL('../player/profile.html', import.meta.url), 'utf8');
  assert.match(html, /placeholder="Passing, First Touch"/);
  assert.doesNotMatch(html, /placeholder="passing, first touch"/);
  assert.match(html, /focusListToCsv\(profile\.goals\)/);
  assert.match(html, /csvToArr\(fd\.get\('goals'\)\)\.map\(\(g\) => g\.toLowerCase\(\)\)/);
});

test('profile edit form shows title-cased equipment, not leftover lowercase tokens', () => {
  const html = readFileSync(new URL('../player/profile.html', import.meta.url), 'utf8');
  assert.match(html, /placeholder="Ball, Cones, Wall"/);
  assert.doesNotMatch(html, /placeholder="ball, cones, wall"/);
  assert.match(html, /formatProfileLabel\(item\)/);
  assert.match(html, /csvToArr\(fd\.get\('equipment'\)\)\.map\(\(item\) => item\.toLowerCase\(\)\)/);
});

test('billingPortalHref returns a trimmed url and rejects missing ones', () => {
  assert.equal(billingPortalHref({ url: ' https://billing.stripe.com/session ' }), 'https://billing.stripe.com/session');
  assert.throws(() => billingPortalHref({}), { message: BILLING_PORTAL_UNAVAILABLE });
  assert.throws(() => billingPortalHref({ url: '' }), { message: BILLING_PORTAL_UNAVAILABLE });
  assert.throws(() => billingPortalHref({ url: null }), { message: BILLING_PORTAL_UNAVAILABLE });
  assert.throws(() => billingPortalHref({ message: 'Portal not ready' }), { message: 'Portal not ready' });
});

test('profile toasts Manage Billing when the portal has no url', () => {
  const html = readFileSync(new URL('../player/profile.html', import.meta.url), 'utf8');
  const src = readFileSync(new URL('../js/components/playerProfile.js', import.meta.url), 'utf8');
  assert.match(html, /bindManageBillingButton/);
  assert.match(src, /Could not open billing portal/);
  assert.match(src, /btn\.disabled = true/);
  assert.match(src, /billingPortalHref\(portal\)/);
  assert.match(src, /btn\.disabled = false/);
});

test('subscription card can hide the weekly plan line', () => {
  const withPlan = renderSubscriptionCard({ plan: 'team', status: 'active' }, helpers);
  assert.match(withPlan, /Weekly plan generated/);
  assert.match(withPlan, /Change Plan/);

  const withoutPlan = renderSubscriptionCard({ plan: 'team', status: 'active' }, { ...helpers, showWeeklyPlan: false });
  assert.match(withoutPlan, /Team Membership/);
  assert.match(withoutPlan, /Change Plan/);
  assert.doesNotMatch(withoutPlan, /Weekly plan generated/);
});

test('coach and parent dashboards show a subscription card without a weekly plan', () => {
  const coach = readFileSync(new URL('../coach/dashboard.html', import.meta.url), 'utf8');
  const parent = readFileSync(new URL('../parent/dashboard.html', import.meta.url), 'utf8');
  for (const html of [coach, parent]) {
    assert.match(html, /id="subscription-card"/);
    assert.match(html, /renderSubscriptionCard/);
    assert.match(html, /showWeeklyPlan: false/);
    assert.match(html, /bindManageBillingButton/);
    assert.match(html, /TrainingLab\.getSubscriptionStatus/);
  }
});
