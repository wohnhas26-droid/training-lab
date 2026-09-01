import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const publicObj = app.slice(app.indexOf('window.TrainingLab = {'));

function htmlFiles(dir = root, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'www' || name === 'android' || name === 'ios') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) htmlFiles(full, acc);
    else if (extname(name) === '.html') acc.push(full);
  }
  return acc;
}

test('getLevels still falls back to bundled PROGRESSION_LEVELS', () => {
  assert.match(app, /return PROGRESSION_LEVELS;/);
});

test('window.TrainingLab does not re-export SUBSCRIPTION_PLANS or getLevelForXp', () => {
  assert.match(publicObj, /window\.TrainingLab = \{/);
  assert.doesNotMatch(publicObj, /^\s*SUBSCRIPTION_PLANS,/m);
  assert.doesNotMatch(publicObj, /^\s*getLevelForXp,/m);
});

test('HTML pages do not read plans or level helpers off TrainingLab', () => {
  const files = htmlFiles();
  assert.ok(files.length > 0);
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /TrainingLab\.SUBSCRIPTION_PLANS/);
    assert.doesNotMatch(html, /TrainingLab\.getLevelForXp/);
  }
});

test('pricing and checkout success import plans from the subscriptions data file', () => {
  const pricing = readFileSync(join(root, 'pricing.html'), 'utf8');
  const success = readFileSync(join(root, 'subscription/success.html'), 'utf8');
  assert.match(pricing, /from '\/js\/data\/subscriptions\.js'/);
  assert.match(success, /from '\/js\/data\/subscriptions\.js'/);
  assert.match(pricing, /SUBSCRIPTION_PLANS\.map\(renderPlan\)/);
});

test('elite plan copy does not claim AI-generated plans', async () => {
  const { SUBSCRIPTION_PLANS } = await import('../js/data/subscriptions.js');
  const elite = SUBSCRIPTION_PLANS.find((p) => p.id === 'elite');
  assert.ok(elite);
  assert.equal(elite.description, 'Player membership plus monthly evaluations.');
  assert.ok(elite.features.includes('Monthly player evaluations'));
  assert.doesNotMatch(elite.description, /AI-powered|AI-generated/i);
  assert.equal(elite.features.filter((f) => /AI-powered|AI-generated/i.test(f)).length, 0);
});

test('player plan lists shipped personalized plans, videos, and coach feedback', async () => {
  const { SUBSCRIPTION_PLANS } = await import('../js/data/subscriptions.js');
  const player = SUBSCRIPTION_PLANS.find((p) => p.id === 'player');
  const features = player.features.join('\n');
  assert.match(features, /Personalized training plans from your profile/);
  assert.match(features, /Video skill assessments/);
  assert.match(features, /Personalized coach feedback/);
});

test('elite plan only adds monthly evaluations on top of player', async () => {
  const { SUBSCRIPTION_PLANS } = await import('../js/data/subscriptions.js');
  const elite = SUBSCRIPTION_PLANS.find((p) => p.id === 'elite');
  const features = elite.features.join('\n');
  assert.deepEqual(elite.features, [
    'Everything in Player Membership',
    'Monthly player evaluations',
  ]);
  assert.doesNotMatch(features, /Personalized training plans from your profile/);
  assert.doesNotMatch(features, /Video skill assessments/);
  assert.doesNotMatch(features, /Personalized (coach )?feedback/);
  assert.doesNotMatch(features, /Advanced position-specific training/);
  assert.doesNotMatch(features, /Strength and conditioning programs/);
  assert.doesNotMatch(features, /Nutrition guidance/);
  assert.doesNotMatch(features, /Mental performance training/);
  assert.doesNotMatch(features, /Exclusive masterclasses/);
  assert.doesNotMatch(features, /Priority support/);
});

test('team plan does not list team communication', async () => {
  const { SUBSCRIPTION_PLANS } = await import('../js/data/subscriptions.js');
  const team = SUBSCRIPTION_PLANS.find((p) => p.id === 'team');
  const features = team.features.join('\n');
  assert.match(features, /Coach dashboard/);
  assert.match(features, /Assign training sessions/);
  assert.match(features, /Player progress reports/);
  assert.doesNotMatch(features, /Team communication/);
});

test('player plan lists a drill library instead of a video library', async () => {
  const { SUBSCRIPTION_PLANS } = await import('../js/data/subscriptions.js');
  const player = SUBSCRIPTION_PLANS.find((p) => p.id === 'player');
  const features = player.features.join('\n');
  assert.match(features, /Complete training drill library/);
  assert.doesNotMatch(features, /video library/i);
});

test('team plan does not list attendance tracking', async () => {
  const { SUBSCRIPTION_PLANS } = await import('../js/data/subscriptions.js');
  const team = SUBSCRIPTION_PLANS.find((p) => p.id === 'team');
  const features = team.features.join('\n');
  assert.match(features, /Coach dashboard/);
  assert.match(features, /Team leaderboards/);
  assert.match(features, /Player progress reports/);
  assert.doesNotMatch(features, /Attendance tracking/);
});
