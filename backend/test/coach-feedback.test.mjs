import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeCoachFeedback } from '../src/lib/feedback.js';

test('includes coach name when the relation is loaded', () => {
  const dto = serializeCoachFeedback({
    feedback: 'Scan before you receive',
    rating: 8,
    date: '2026-08-22',
    coach: { name: 'Coach Martinez' },
  });
  assert.deepEqual(dto, {
    feedback: 'Scan before you receive',
    rating: 8,
    date: '2026-08-22',
    coachName: 'Coach Martinez',
  });
});

test('coachName is null when the coach relation is missing', () => {
  const dto = serializeCoachFeedback({
    feedback: 'Nice work',
    rating: 7,
    date: '2026-08-01',
  });
  assert.equal(dto.coachName, null);
});
