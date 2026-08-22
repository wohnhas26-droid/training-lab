import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../js/components/ui.js';
import { renderLinkPlayerCard } from '../js/components/parentChild.js';

test('empty parent state asks to link a player and does not invent stats', () => {
  const html = renderLinkPlayerCard({ escapeHtml });
  assert.match(html, /Link Player/);
  assert.match(html, /player@example.com/);
  assert.doesNotMatch(html, /1200/);
  assert.doesNotMatch(html, /8\/10/);
});
