import test from 'node:test';
import assert from 'node:assert/strict';
import { saveWorldSnapshot, mergeWorldCombatSnapshot } from '../server/data/world-combat-checkpoint.js';
import { compactWorldSnapshot } from '../server/data/store.js';

test('routine world saves preserve checkpoint-owned combat histories', async () => {
  let statement = '';
  const sql = async (strings) => { statement = strings.join('?'); };
  const snapshot = { bossFights: Array(1000).fill({ id: 'old' }), bossDamageLogs: Array(1000).fill({ id: 'log' }), claimedLoot: ['claim'], clans: [] };
  const compact = compactWorldSnapshot(snapshot);
  assert.equal(compact.bossFights, undefined);
  assert.equal(compact.bossDamageLogs, undefined);
  assert.deepEqual(compact.claimedLoot, ['claim']);
  await saveWorldSnapshot(sql, 'state', compact);
  assert.match(statement, /game_state\.state \|\| EXCLUDED\.state/);
  assert.doesNotMatch(statement, /DELETE FROM world_combat_state/);
});

test('checkpoint recovery overlays a newer fight and damage log on the base snapshot', () => {
  const state = { bossFights: [{ id: 'fight', current_hp: 100 }], bossDamageLogs: [{ id: 'log', fight_id: 'fight', player_email: 'p', damage: 1 }] };
  mergeWorldCombatSnapshot(state, [
    { entity_type: 'bossFights', entity_id: 'fight', state: { id: 'fight', current_hp: 40 } },
    { entity_type: 'bossDamageLogs', entity_id: JSON.stringify(['fight', 'p']), state: { id: 'log', fight_id: 'fight', player_email: 'p', damage: 61 } },
  ]);
  assert.equal(state.bossFights[0].current_hp, 40);
  assert.equal(state.bossDamageLogs[0].damage, 61);
});
