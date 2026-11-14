import test from 'node:test';
import assert from 'node:assert/strict';
import { seedProfileFromAuth, mergeSavedProfile } from '../src/lib/profileSnapshots.js';
import { playerDb, savePlayerSnapshot } from '../server/data/player-db.js';
import { calculateEnergy } from '../src/lib/gameConfig.js';

test('auth rerenders preserve earned energy and talent points', () => {
  const current = { id: 'p1', energy: 1160, available_talent_points: 7 };
  const auth = { id: 'p1', energy: 160, available_talent_points: 6 };
  assert.equal(seedProfileFromAuth(current, auth), current);
  assert.deepEqual(seedProfileFromAuth(null, auth), auth);
  assert.equal(seedProfileFromAuth(current, { id: 'p2' }).id, 'p2');
});

test('ignored economy patches never create phantom energy or talents', () => {
  const current = { id: 'p1', energy: 160, available_talent_points: 6 };
  const result = mergeSavedProfile(current, { energy: 1160, available_talent_points: 7 }, current);
  assert.deepEqual(result, current);
  const rewarded = { ...current, energy: 1160, available_talent_points: 7 };
  assert.deepEqual(mergeSavedProfile(current, {}, rewarded), rewarded);
});

test('canonical DB player wins over stale runtime snapshot during startup', () => {
  const db = { id: 'p1', energy: 1160, available_talent_points: 7 };
  const stale = { id: 'p1', energy: 160, available_talent_points: 6 };
  assert.deepEqual(playerDb.mergePlayerLists([db], [stale, { id: 'p2' }]), [db, { id: 'p2' }]);
});

test('overnight regeneration preserves saved energy above the cap', () => {
  assert.equal(calculateEnergy('2026-10-10T00:00:00Z', 1160, 130, 1), 1160);
});

test('player and progress are persisted atomically in one database call', async () => {
  const calls = [];
  const sql = async (strings, ...values) => { calls.push({ query: strings.join('?'), values }); };
  const record = playerDb.toDbPlayerRecord({ id: 'p1', energy: 1160, available_talent_points: 7 });
  const progress = JSON.stringify({ player: { energy: 1160, available_talent_points: 7 } });
  await savePlayerSnapshot(sql, record, progress);
  assert.equal(calls.length, 1);
  assert.match(calls[0].query, /WITH saved_player AS/);
  assert.match(calls[0].query, /FROM saved_player/);
  assert.equal(JSON.parse(calls[0].values[5]).energy, 1160);
  assert.equal(JSON.parse(calls[0].values.at(-1)).player.available_talent_points, 7);
  await assert.rejects(savePlayerSnapshot(async () => { throw new Error('DB unavailable'); }, record, progress), /DB unavailable/);
});
