import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../js/components/ui.js';
import {
  REPORTS_INTRO,
  REPORTS_NOTE,
  reportsSubtitleForChild,
  reportsFailedSubtitle,
  renderReportsFailed,
  renderParentReportCard,
} from '../js/components/parentReports.js';

test('parent report copy talks about training activity, not evaluations', () => {
  assert.match(REPORTS_INTRO, /training summaries/);
  assert.match(REPORTS_NOTE, /not Elite monthly evaluations/);
  assert.doesNotMatch(REPORTS_INTRO, /evaluations of your player's development/);
  assert.equal(reportsSubtitleForChild('Alex Rivera'), 'Training activity for Alex Rivera');
  assert.match(reportsFailedSubtitle('Alex Rivera'), /Could not load Alex Rivera's report cards/);
});

test('parent report card labels the number as an activity score and escapes the month', () => {
  const html = renderParentReportCard({
    label: 'August <2026>',
    score: 7,
    consistency: 'Good',
    sessions: 3,
    minutes: 80,
    skills: 12,
  }, { escapeHtml });
  assert.match(html, /August &lt;2026&gt; Report Card/);
  assert.match(html, /7\/10/);
  assert.match(html, /Activity score/);
  assert.match(html, /Sessions completed: 3/);
  assert.doesNotMatch(html, /evaluation/i);
  assert.doesNotMatch(html, /August <2026>/);
});

test('failed reports show a retry message, not an empty training history', () => {
  const html = renderReportsFailed();
  assert.match(html, /Try again in a moment/);
  assert.doesNotMatch(html, /No training months to score yet/);
});

test('parent reports page uses training-summary copy and the activity-score cards', () => {
  const html = readFileSync(new URL('../parent/reports.html', import.meta.url), 'utf8');
  assert.match(html, /REPORTS_INTRO/);
  assert.match(html, /REPORTS_NOTE/);
  assert.match(html, /reportsSubtitleForChild/);
  assert.match(html, /reportsFailedSubtitle/);
  assert.match(html, /renderParentReportCard/);
  assert.match(html, /Monthly training summaries scored from session activity/);
  assert.match(html, /They are not Elite monthly evaluations/);
  assert.doesNotMatch(html, /Detailed monthly evaluations/);
  assert.doesNotMatch(html, /Monthly evaluations for/);
});
