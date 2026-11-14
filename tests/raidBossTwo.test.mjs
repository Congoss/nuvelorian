import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_SCHEDULE, eventPhase } from '../src/lib/eventSchedule.js';
import { RAID_BOSS_EVENT_KEY, RAID_BOSS_MAX_HP, migrateRaidBossHealth } from '../src/lib/raidBossConfig.js';

test('old raid gets a fresh HP bar and leaderboard; current raid data stays intact', () => {
  const raid = { id: 'global-raid-boss', max_hp: 5000000, current_hp: 3238174, status: 'active', participants: { player: { damage: 1761826 } } };
  const next = migrateRaidBossHealth(raid);
  assert.equal(next.max_hp, 30000000);
  assert.equal(next.current_hp, 30000000);
  assert.deepEqual(next.participants, {});
  assert.equal(next.event_key, RAID_BOSS_EVENT_KEY);
  assert.deepEqual(migrateRaidBossHealth(next), next);
});

test('new raid has 30 million HP and exactly seven days with exclusive end boundary', () => {
  assert.equal(RAID_BOSS_MAX_HP, 30_000_000);
  const { startAt, endAt } = EVENT_SCHEDULE['raid-boss'];
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  assert.equal(end - start, 7 * 86400000);
  assert.equal(eventPhase('raid-boss', start - 1), 'upcoming');
  assert.equal(eventPhase('raid-boss', start), 'active');
  assert.equal(eventPhase('raid-boss', end - 1), 'active');
  assert.equal(eventPhase('raid-boss', end), 'ended');
});

test('new raid leaves the fishing event dates unchanged', () => {
  assert.equal(EVENT_SCHEDULE['space-fishing'].startAt, '2026-10-07T15:00:00.000Z');
  assert.equal(EVENT_SCHEDULE['space-fishing'].endAt, '2026-10-21T15:00:00.000Z');
});
