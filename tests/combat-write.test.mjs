import test from 'node:test';
import assert from 'node:assert/strict';
import { commitCombatWrite, saveCombatBatch } from '../server/data/combat-write.js';

test('ship commit with a lost acknowledgement publishes only after state and player rows are verified', async () => {
  const batch = { mode: 'ship', stateKey: 'clan', stateChanged: true, state: { receipts: { attack: true } }, players: [{ id: 'player' }] };
  const error = Object.assign(new Error('connection reset'), { code: 'ECONNRESET' });
  const persist = async () => { throw error; };
  const probe = committed => async (strings, ...values) => {
    assert.match(strings.join('?'), /clan_ship_state/);
    assert.match(strings.join('?'), /player_progress/);
    assert.ok(values.includes(JSON.stringify(batch.state)));
    return [{ committed }];
  };
  await commitCombatWrite(probe(true), persist, () => batch);
  await assert.rejects(commitCombatWrite(probe(false), persist, () => batch), error);
});

for (const mode of ['ship', 'world']) {
  test(mode + ' writes player and combat state in one parameterized statement', async () => {
    const calls = [];
    const player = { id: 'player', data: { weapon_inventory: { 'large-poison': 4 } } };
    const state = mode === 'world' ? [{entity_type:'bossFights',entity_id:'f',state:{current_hp:90}}] : {fights:{hull:{current_hp:90}}};
    await saveCombatBatch(async (strings, ...values) => calls.push({ strings, values }), {
      mode, stateKey: 'fight', state, stateChanged: true, players: [player],
    });
    assert.equal(calls.length, 1);
    const [{ strings, values }] = calls;
    assert.equal(strings.length, values.length + 1);
    assert.match(strings.join('?'), /UPDATE players/);
    assert.match(strings.join('?'), mode === 'ship' ? /UPDATE clan_ship_state.*ship.state \|\|/s : /INSERT INTO world_combat_state/);
    assert.deepEqual(JSON.parse(values[0]), [player]);
    assert.ok(values.includes(JSON.stringify(state)));
  });
}

test('lost commit acknowledgement is reconciled before releasing the write barrier', async () => {
  const { reconcileCombatWrite } = await import('../server/data/combat-write.js');
  let calls = 0;
  const sql = async () => { if (++calls === 1) throw Object.assign(Error('connection lost'), { code: 'ECONNRESET' }); return [{ committed: true }]; };
  const batch = { mode: 'world', stateKey: 'test', state: {}, players: [] };
  assert.equal(await reconcileCombatWrite(sql, batch, { code: 'ECONNRESET' }, { wait: async () => {} }), true);
  assert.equal(calls, 2);
  assert.equal(await reconcileCombatWrite(sql, batch, { code: '23514' }), false);
});
