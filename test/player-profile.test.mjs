import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  assert.match(html, /&lt;Touch&gt;/);
  assert.match(html, /Cones&lt;script&gt;/);
  assert.match(html, /Midfielder/);
  assert.doesNotMatch(html, /<touch>/);
  assert.doesNotMatch(html, /<script>/);
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
  assert.match(elite, /AI Personal Training/);
  assert.match(elite, />Active</);

  const unknown = renderSubscriptionCard({ plan: 'gold<script>', status: 'trialing' }, helpers);
  assert.match(unknown, /gold&lt;script&gt;/);
  assert.doesNotMatch(unknown, /gold<script>/);
  assert.match(unknown, /Free Trial/);
});

test('profile edit form shows human improvement areas, not snake_case ids', () => {
  const html = readFileSync(new URL('../player/profile.html', import.meta.url), 'utf8');
  assert.match(html, /placeholder="ball mastery, passing"/);
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
