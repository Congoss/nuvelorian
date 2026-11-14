import test from 'node:test';
import assert from 'node:assert/strict';
import { createWriteQueue } from '../server/utils/writeQueue.js';

test('routine saves cannot join ahead of an exclusive combat commit', async () => {
  const calls = [];
  const queue = createWriteQueue(ids => calls.push(ids.join(',')));
  const first = queue(['before']);
  const combat = queue.exclusive(() => calls.push('combat'));
  const last = queue(['after']);
  assert.equal(last, queue(['also-after']));
  await Promise.all([first, combat, last]);
  assert.deepEqual(calls, ['before', 'combat', 'after,also-after']);
});

test('profile writes and accepted combat packets reserve persistence in arrival order', async () => {
 const { enqueueBackgroundCombatWrite } = await import('../server/data/combat-write.js');
 const { withKeyLock } = await import('../server/utils/keyLock.js');
 const order = [];
 const profile = label => withKeyLock('persist-player:ordering-test', () => { order.push(label); });
 const combat = label => enqueueBackgroundCombatWrite(['ordering-test'], () => { order.push(label); });
 await Promise.all([profile('profile first'), combat('combat second')]);
 await Promise.all([combat('combat first'), profile('profile second')]);
 assert.deepEqual(order, ['profile first','combat second','combat first','profile second']);
});

test('late committed profile reward rebases a queued hit without delaying acceptance', async () => {
 const { enqueueBackgroundCombatWrite } = await import('../server/data/combat-write.js');
 const { acquireKeyLock } = await import('../server/utils/keyLock.js');
 const { playerDb, publishCommittedProfile } = await import('../server/data/player-db.js');
 const player = {id:'late-profile-test',weapon_inventory:{'large-poison':10},combat_receipts:[],pending_boss_boxes:[]};
 const before = structuredClone(player);
 const after = {...structuredClone(before),weapon_inventory:{'large-poison':13}};
 const release = await acquireKeyLock('persist-player:'+player.id);
 player.weapon_inventory['large-poison']--;
 player.combat_receipts.push({id:'hit'});
 player.pending_boss_boxes.push({instanceId:'reward'});
 const record = playerDb.toDbPlayerRecord(player);
 let saved;
 const write = enqueueBackgroundCombatWrite([player.id], () => { saved = structuredClone(record); }, [record]);
 try {
  assert.equal(saved,undefined);
  publishCommittedProfile(player,before,after,['weapon_inventory']);
  assert.equal(player.weapon_inventory['large-poison'],12);
 } finally { release(); }
 await write;
 assert.equal(saved.data.weapon_inventory['large-poison'],12);
 assert.deepEqual(saved.data.combat_receipts,[{id:'hit'}]);
 assert.deepEqual(saved.data.pending_boss_boxes,[{instanceId:'reward'}]);
});

test('a packet already handed to SQL is excluded from profile rebasing', async () => {
 const { enqueueBackgroundCombatWrite, rebasePendingCombatRecords } = await import('../server/data/combat-write.js');
 let unblock, started;
 const blocked = new Promise(resolve => { unblock = resolve; });
 const entered = new Promise(resolve => { started = resolve; });
 const id = 'in-flight-boundary';
 const active = {id, data:{energy:10}};
 const waiting = {id, data:{energy:9}};
 const first = enqueueBackgroundCombatWrite([id], async () => { started(); await blocked; }, [active]);
 await entered;
 const second = enqueueBackgroundCombatWrite([id], async () => {}, [waiting]);
 try {
  rebasePendingCombatRecords(id, record => { record.data.energy += 3; });
  assert.equal(active.data.energy,10);
  assert.equal(waiting.data.energy,12);
 } finally {
  unblock();
  await Promise.all([first,second]);
 }
});
