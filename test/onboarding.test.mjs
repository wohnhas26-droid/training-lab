import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('onboarding improvement pills use human phrases, not snake_case ids', () => {
  const html = readFileSync(new URL('../onboarding.html', import.meta.url), 'utf8');
  const improvement = html.slice(html.indexOf("renderPills('improvement-group'"));
  assert.match(improvement, /value: 'ball mastery'/);
  assert.match(improvement, /value: 'first touch'/);
  assert.match(improvement, /label: 'Ball Mastery'/);
  assert.match(improvement, /label: 'First Touch'/);
  assert.doesNotMatch(improvement.slice(0, 600), /ball_mastery/);
  assert.doesNotMatch(improvement.slice(0, 600), /first_touch/);
});

test('onboarding equipment pills use title-case labels and lowercase stored values', () => {
  const html = readFileSync(new URL('../onboarding.html', import.meta.url), 'utf8');
  const equipment = html.slice(html.indexOf("renderPills('equipment-group'"));
  assert.match(equipment, /value: 'ball'/);
  assert.match(equipment, /label: 'Ball'/);
  assert.match(equipment, /value: 'agility ladder'/);
  assert.match(equipment, /label: 'Agility Ladder'/);
  assert.doesNotMatch(equipment.slice(0, 700), /label: 'ball'/);
  assert.doesNotMatch(equipment.slice(0, 700), /label: 'agility ladder'/);
});
