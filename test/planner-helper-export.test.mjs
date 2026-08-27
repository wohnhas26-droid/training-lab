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

test('getEvaluation still falls back to generateEvaluation when elite and offline', () => {
  assert.match(app, /return generateEvaluation\(state\.profile \|\| \{\}, state\.progress \|\| \{\}\);/);
});

test('offline onboarding still writes profile, plan, and subscription locally', () => {
  assert.match(app, /saveProfile\(profile\);/);
  assert.match(app, /const plan = generatePersonalizedPlan\(profile\);/);
  assert.match(app, /if \(formData\.plan\) saveSubscription\(formData\.plan\);/);
});

test('window.TrainingLab does not re-export unused planner helpers', () => {
  assert.match(publicObj, /window\.TrainingLab = \{/);
  assert.doesNotMatch(publicObj, /^\s*saveProfile,/m);
  assert.doesNotMatch(publicObj, /^\s*saveSubscription,/m);
  assert.doesNotMatch(publicObj, /^\s*generatePersonalizedPlan,/m);
  assert.doesNotMatch(publicObj, /^\s*generateEvaluation,/m);
  assert.doesNotMatch(publicObj, /^\s*getParentReport,/m);
});

test('window.TrainingLab does not re-export unused saveState', () => {
  assert.match(publicObj, /window\.TrainingLab = \{/);
  assert.match(publicObj, /^\s*loadState,/m);
  assert.doesNotMatch(publicObj, /^\s*saveState,/m);
});

test('HTML pages use catalog getters instead of leftover planner helpers', () => {
  const files = htmlFiles();
  assert.ok(files.length > 0);
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /TrainingLab\.saveProfile/);
    assert.doesNotMatch(html, /TrainingLab\.saveSubscription/);
    assert.doesNotMatch(html, /TrainingLab\.generatePersonalizedPlan/);
    assert.doesNotMatch(html, /TrainingLab\.generateEvaluation/);
    assert.doesNotMatch(html, /TrainingLab\.getParentReport/);
    assert.doesNotMatch(html, /TrainingLab\.saveState/);
  }
});
