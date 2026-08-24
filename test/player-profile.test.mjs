import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, capitalize } from '../js/components/ui.js';
import { renderProfileCard, renderSubscriptionCard } from '../js/components/playerProfile.js';

const helpers = { escapeHtml, capitalize };

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
  assert.match(html, /&lt;touch&gt;/);
  assert.match(html, /cones&lt;script&gt;/);
  assert.match(html, /Midfielder/);
  assert.doesNotMatch(html, /<touch>/);
  assert.doesNotMatch(html, /<script>/);
});

test('empty profile lists show an em dash instead of leftover copy', () => {
  const html = renderProfileCard({ name: 'Alex', email: 'a@test.com' }, {}, helpers);
  assert.match(html, /Goals:<\/span> —/);
  assert.match(html, /Equipment:<\/span> —/);
});

test('subscription card uses known plan names and escapes unknown plans', () => {
  const elite = renderSubscriptionCard({ plan: 'elite', status: 'active' }, helpers);
  assert.match(elite, /Elite Membership/);
  assert.match(elite, /AI Personal Training/);
  assert.match(elite, />Active</);

  const unknown = renderSubscriptionCard({ plan: 'gold<script>', status: 'trialing' }, helpers);
  assert.match(unknown, /gold&lt;script&gt;/);
  assert.doesNotMatch(unknown, /gold<script>/);
  assert.match(unknown, /Free Trial/);
});
