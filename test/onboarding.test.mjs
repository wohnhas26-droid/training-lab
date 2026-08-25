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
