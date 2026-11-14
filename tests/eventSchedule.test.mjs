import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_SCHEDULE, eventPhase, eventCountdown } from '../src/lib/eventSchedule.js';
test('raid retains its dates and fishing stays open-ended', () => {
  const raid = EVENT_SCHEDULE['raid-boss'];
  const fish = EVENT_SCHEDULE['space-fishing'];
  assert.equal(raid.startAt, '2026-10-15T08:28:00.000Z');
  assert.equal(raid.endAt, '2026-10-22T08:28:00.000Z');
  assert.equal(fish.endAt, null);
  assert.equal(eventPhase('raid-boss', Date.parse(raid.startAt) - 1), 'upcoming');
  assert.equal(eventPhase('raid-boss', Date.parse(raid.startAt)), 'active');
  assert.equal(eventPhase('raid-boss', Date.parse(raid.endAt)), 'ended');
  assert.equal(eventCountdown('space-fishing', Date.parse(fish.startAt), 'uk'), '');
  assert.equal(eventCountdown('raid-boss', Date.parse(raid.endAt), 'en'), 'Ended');
});
