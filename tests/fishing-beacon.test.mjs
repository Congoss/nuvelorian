import test from 'node:test';
import assert from 'node:assert/strict';
import { fishingBeaconState } from '../src/lib/fishingBeacon.js';
import { EVENT_START_AT } from '../src/lib/eventSchedule.js';

const now = Date.parse(EVENT_START_AT) + 100000;
const profile = { level: 10 };
test('beacon respects level and event opening', () => {
  assert.equal(fishingBeaconState({ level: 9 }, now), null);
  assert.equal(fishingBeaconState(profile, Date.parse(EVENT_START_AT) - 1), null);
  assert.equal(fishingBeaconState(profile, now), 'available');
});
test('beacon follows wait, bite window, reel-in and claimed result', () => {
  const cycle = { startAt: now, hookStartAt: now + 1000, hookEndAt: now + 2000, finishAt: now + 3000 };
  const fishing = { ...profile, cosmo_fishing_cycle: cycle };
  assert.equal(fishingBeaconState(fishing, now), null);
  assert.equal(fishingBeaconState(fishing, now + 1000), 'bite');
  assert.equal(fishingBeaconState(fishing, now + 2000), null);
  assert.equal(fishingBeaconState(fishing, now + 3000), 'ready');
  assert.equal(fishingBeaconState({ ...fishing, cosmo_fishing_cycle: { ...cycle, claimed: true } }, now), 'available');
  assert.equal(fishingBeaconState({ ...fishing, cosmo_fishing_last_result: {}, cosmo_fishing_last_result_seen: false }, now), 'result');
});
