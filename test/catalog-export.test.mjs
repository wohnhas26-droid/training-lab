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

test('getCatalog still falls back to bundled exercises and categories', () => {
  assert.match(app, /return \{ exercises: EXERCISES, categories: TRAINING_CATEGORIES \}/);
});

test('getChallenges falls back to bundled CHALLENGES only when offline', () => {
  const fn = app.slice(app.indexOf('getChallenges: async'), app.indexOf('getEvaluation: async'));
  assert.match(fn, /return isApiMode\(\) \? null : hydrateChallenges\(CHALLENGES, loadState\(\)\);/);
});

test('getAchievements falls back to bundled ACHIEVEMENTS only when offline', () => {
  const fn = app.slice(app.indexOf('getAchievements: async'), app.indexOf('getLevels: async'));
  assert.match(fn, /if \(isApiMode\(\)\) return null;/);
  assert.match(fn, /all: ACHIEVEMENTS/);
});

test('getCatalogAchievements still falls back to bundled ACHIEVEMENTS', () => {
  assert.match(app, /return ACHIEVEMENTS;/);
});

test('window.TrainingLab does not re-export bundled catalogs', () => {
  assert.match(publicObj, /window\.TrainingLab = \{/);
  assert.doesNotMatch(publicObj, /^\s*TRAINING_CATEGORIES,/m);
  assert.doesNotMatch(publicObj, /^\s*EXERCISES,/m);
  assert.doesNotMatch(publicObj, /^\s*CHALLENGES,/m);
  assert.doesNotMatch(publicObj, /^\s*ACHIEVEMENTS,/m);
});

test('HTML pages do not read bundled catalogs off TrainingLab', () => {
  const files = htmlFiles();
  assert.ok(files.length > 0);
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /TrainingLab\.TRAINING_CATEGORIES/);
    assert.doesNotMatch(html, /TrainingLab\.EXERCISES/);
    assert.doesNotMatch(html, /TrainingLab\.CHALLENGES/);
    assert.doesNotMatch(html, /TrainingLab\.ACHIEVEMENTS/);
  }
});
