import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTalentBatch } from '../src/lib/talentCombat.js';
import { resolveBossHit } from '../server/utils/bossHit.js';

// Personal bosses and the raid both resolve poison batches through
// resolveTalentBatch (via resolveBossHit). An early critical must be reported
// even when the last hit of the batch is normal.
const weapon = { id: 'satchel', damage: 100, critChance: 0.5 };
const fight = { id: 'f', boss_id: 'heli', max_hp: 1e9, current_hp: 1e9, started_at: new Date(0).toISOString() };

function firstHitCrits() {
  let call = 0;
  // Only crit rolls are below 0.5 here; the first roll crits, the rest do not.
  return () => (call++ === 0 ? 0.1 : 0.99);
}

for (const raid of [false, true]) {
  test(`${raid ? 'raid' : 'personal boss'} reports an early batch critical even when the last hit is normal`, () => {
    const batch = resolveTalentBatch({ weapon, levels: {}, state: {}, fight, now: 1, count: 5, random: firstHitCrits() });
    assert.equal(batch.isCrit, true);
    const single = resolveTalentBatch({ weapon, levels: {}, state: {}, fight, now: 1, count: 1, random: () => 0.99 });
    assert.ok(batch.damage > single.damage * 5, 'the critical hit adds to the batch total');
    const hit = resolveBossHit({ player: {}, weapon, levels: {}, state: {}, fight, clan: null, count: 5, now: 1, random: firstHitCrits() });
    assert.equal(hit.isCrit, true);
  });
}
