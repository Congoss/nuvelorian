import test from 'node:test';
import assert from 'node:assert/strict';
import { executeWorldCombat } from '../server/services/world-combat.js';
import { createWriteQueue } from '../server/utils/writeQueue.js';
import { acquireKeyLock } from '../server/utils/keyLock.js';

process.env.NODE_ENV = 'test';

function fixture(save = async () => {}) {
  const queue = createWriteQueue(async () => {});
  const store = { players: [{ id: 'a', created_by: 'a@game', weapon_inventory: { 'small-poison': 1000 } }], clans: [], bossFights: [{ id: 'f', opened_by_email: 'a@game', status: 'active', current_hp: 100000 }], bossDamageLogs: [], claimedLoot: [], raidBoss: { participants: {} },
    queueCombatCommit(work) { return queue.exclusive(() => work(save)); } };
  const playerDb = { toDbPlayerRecord(p) { return { id: p.id, data: p }; }, buildPlayerProgress(p) { return { inventory: p.weapon_inventory }; }, acknowledgeCommittedPlayer() {} };
  const options = { store, playerDb, actorId: 'a', body: { requestId: 'one', weaponId: 'satchel', multiplier: 100 }, scope: 'boss:f',
    calculate(response) {
      store.players[0].weapon_inventory['small-poison'] -= 100;
      store.bossFights[0].current_hp -= 3000;
      store.bossDamageLogs.push({ id: 'damage', damage: 3000 });
      response.writeHead(200, {}); response.end(JSON.stringify({ hit: { damage: 3000, isCrit: true } }));
    } };
  return options;
}

test('a clan member outside the fight and active quests does not block an attack', async () => {
 const options=fixture();
 options.store.players[0].clan_id='clan';
 options.store.players.push({id:'idle-member',clan_id:'clan'});
 options.store.clans=[{id:'clan',quests:[{status:'COMPLETED',owner_id:'idle-member',type:'hits'}]}];
 const release=await acquireKeyLock('action-player:idle-member');
 let timer;
 try {
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Unrelated member blocked the attack')),500);});
  const result=await Promise.race([executeWorldCombat(options),timeout]);
  assert.equal(result.statusCode,200);
 } finally {clearTimeout(timer);release();}
});

test('HP and poison stay private until durable commit; cached replay preserves crit without spending twice', async () => {
  let finish; let started;
  const ready = new Promise(resolve => { started = resolve; });
  const gate = new Promise(resolve => { finish = resolve; });
  let writes = 0;
  const options = fixture(async (draft, players) => {
    writes++; assert.equal(draft.bossFights[0].current_hp, 97000); assert.equal(players[0].data.weapon_inventory['small-poison'], 900);
    started(); await gate;
  });
  const pending = executeWorldCombat(options);
  await ready;
  assert.equal(options.store.bossFights[0].current_hp, 100000);
  assert.equal(options.store.players[0].weapon_inventory['small-poison'], 1000);
  finish(); const first = await pending;
  const replay = await executeWorldCombat(options);
  assert.equal(first.body, replay.body); assert.equal(writes, 1);
  assert.equal(options.store.bossFights[0].current_hp, 97000);
  assert.equal(options.store.players[0].weapon_inventory['small-poison'], 900);
});

test('failed durable write leaves HP, poison, log and receipt untouched; same request can retry', async () => {
  let fail = true;
  const options = fixture(async () => { if (fail) throw Error('storage failed'); });
  await assert.rejects(executeWorldCombat(options), /storage failed/);
  assert.equal(options.store.bossFights[0].current_hp, 100000);
  assert.equal(options.store.players[0].weapon_inventory['small-poison'], 1000);
  assert.deepEqual(options.store.bossDamageLogs, []);
  assert.equal(options.store.players[0].combat_receipts, undefined);
  fail = false; await executeWorldCombat(options);
  assert.equal(options.store.players[0].weapon_inventory['small-poison'], 900);
});

test('ten rapid x100 batches commit exact cumulative HP and inventory with duplicate requests coalesced', async () => {
  const options = fixture();
  const requests = Array.from({ length: 10 }, (_, i) => ({ ...options, body: { ...options.body, requestId: 'batch-' + i } }));
  await Promise.all(requests.flatMap(request => [executeWorldCombat(request), executeWorldCombat(request)]));
  assert.equal(options.store.bossFights[0].current_hp, 70000);
  assert.equal(options.store.players[0].weapon_inventory['small-poison'], 0);
});

test('request fingerprint mismatch is rejected without another hit', async () => {
  const options = fixture(); await executeWorldCombat(options);
  await assert.rejects(executeWorldCombat({ ...options, body: { ...options.body, multiplier: 10 } }), { code: 'COMBAT_REQUEST_CONFLICT' });
  assert.equal(options.store.players[0].weapon_inventory['small-poison'], 900);
});

test('unrelated world changes during SQL survive publication', async () => {
  const options = fixture(async () => { options.store.bossFights.push({ id: 'new', current_hp: 42 }); });
  await executeWorldCombat(options);
  assert.equal(options.store.bossFights.find(f => f.id === 'new').current_hp, 42);
});

test('evicted successful receipt cannot spend poison again after later attacks or reload', async () => {
  const options = fixture();
  options.store.players[0].weapon_inventory['small-poison'] = 2000;
  for (let i = 0; i < 10; i++) await executeWorldCombat({ ...options, body: { ...options.body, requestId: 'combat:1000:' + i } });
  options.store.players = JSON.parse(JSON.stringify(options.store.players));
  await assert.rejects(executeWorldCombat({ ...options, body: { ...options.body, requestId: 'combat:1000:0' } }), { code: 'COMBAT_REQUEST_EXPIRED' });
  assert.equal(options.store.players[0].weapon_inventory['small-poison'], 1000);
  assert.equal(options.store.bossFights[0].current_hp, 70000);
});

test('unrelated player archives and ship history are not copied by an ordinary hit', async () => {
 const options=fixture(async (_draft,_records,changes)=>{
  assert.equal(Object.hasOwn(changes.find(row=>row.entity_type==='clans').state,'ship'),false);
  assert.doesNotThrow(()=>JSON.stringify(changes));
 });
 options.store.players[0].clan_id='clan';
 const history={toJSON(){throw Error('ship archive must stay outside ordinary combat drafts')}};
 options.store.clans=[{id:'clan',ship:history,achievements:{damage:0}}];
 options.store.players.push({id:'unrelated',talent_combat_state:{past:{}},toJSON(){throw Error('unrelated player must not be cloned')}});
 const calculate=options.calculate;
 options.calculate=response=>{calculate(response);options.store.clans[0].achievements.damage+=3000};
 await executeWorldCombat(options);
 assert.equal(options.store.clans[0].ship,history);
 assert.equal(options.store.clans[0].achievements.damage,3000);
});

test('a read-side profile change while SQL is pending survives combat publication', async () => {
 const options=fixture(async()=>{options.store.players[0].ui_preferences={language:'uk'}});
 await executeWorldCombat(options);
 assert.deepEqual(options.store.players[0].ui_preferences,{language:'uk'});
 assert.equal(options.store.players[0].weapon_inventory['small-poison'],900);
});

test('ordinary combat does not serialize unrelated clan quest archives', async () => {
 const options=fixture();
 options.store.players[0].clan_id='own';
 options.store.players[0].clan_name='Own Clan';
 const archived={toJSON(){throw Error('unrelated clan archive copied')}};
 options.store.clans=[{id:'other',name:'Other Clan',quests:archived}];
 await executeWorldCombat(options);
 assert.equal(options.store.clans[0].quests,archived);
});

test('reused archive IDs never turn untouched history into duplicate combat writes', async () => {
 let changes;
 const options=fixture(async (_draft,_records,rows)=>{changes=rows;});
 options.store.bossDamageLogs=[{id:'legacy-reused',fight_id:'old-a',player_email:'old@a',damage:40},{id:'legacy-reused',fight_id:'old-b',player_email:'old@b',damage:80}];
 await executeWorldCombat(options);
 assert.equal(changes.filter(row=>row.entity_type==='bossDamageLogs').length,1);
 assert.equal(changes.some(row=>row.state.fight_id==='old-a'||row.state.fight_id==='old-b'),false);
 assert.equal(new Set(changes.map(row=>row.entity_type+':'+row.entity_id)).size,changes.length);
 assert.deepEqual(options.store.bossDamageLogs.slice(0,2),[{id:'legacy-reused',fight_id:'old-a',player_email:'old@a',damage:40},{id:'legacy-reused',fight_id:'old-b',player_email:'old@b',damage:80}]);
});

test('background combat keeps two queued revisions independent', async () => {
  const previous = process.env.COMBAT_BACKGROUND_WRITES;
  process.env.COMBAT_BACKGROUND_WRITES = '1';
  const options = fixture();
  const batches = [];
  options.store.queueCombatInBackground = work => work(async (_draft, players, changes) => {
    batches.push(structuredClone({players, changes}));
  });
  try {
    const first = await executeWorldCombat(options);
    assert.equal(first.statusCode, 200);
    assert.equal(options.store.bossFights[0].current_hp, 97000);
    options.store.players[0].tentacles = 700;
    const replay = await executeWorldCombat(options);
    assert.equal(replay.body, first.body);
    assert.equal(options.store.bossFights[0].current_hp, 97000);
    await executeWorldCombat({...options, body:{...options.body, requestId:'two'}});
    assert.deepEqual(batches.map(batch=>batch.changes.find(x=>x.entity_type==='bossFights').state.current_hp), [97000,94000]);
    assert.deepEqual(batches.map(batch=>batch.players[0].data.weapon_inventory['small-poison']), [900,800]);
    assert.deepEqual(batches.map(batch=>batch.players[0].data.combat_receipts.length), [1,2]);
  } finally {
    if (previous === undefined) delete process.env.COMBAT_BACKGROUND_WRITES;
    else process.env.COMBAT_BACKGROUND_WRITES = previous;
  }
});

test('ordinary and raid bursts respond without waiting for the background writer', async t => {
 const previous = process.env.COMBAT_BACKGROUND_WRITES;
 process.env.COMBAT_BACKGROUND_WRITES = '1';
 try {
  for (const scope of ['boss:f', 'raid']) {
   const options = fixture();
   options.scope = scope;
   options.store.raidBoss = { id:'raid', status:'active', current_hp:100000, participants:{} };
   const writes = [];
   options.store.queueCombatInBackground = work => work(async (_draft, players) => { writes.push(structuredClone(players)); });
   options.calculate = response => {
    options.store.players[0].weapon_inventory['small-poison']--;
    const fight = scope === 'raid' ? options.store.raidBoss : options.store.bossFights[0];
    fight.current_hp -= 100;
    response.writeHead(200, {});
    response.end('{}');
   };
   const start = performance.now();
   const requests = Array.from({length:100}, (_,i) => executeWorldCombat({...options,body:{...options.body,requestId:'burst-'+i}}));
   const replies = await Promise.all(requests);
   const elapsed = performance.now() - start;
   assert.ok(replies.every(reply => reply.statusCode === 200));
   assert.equal(writes.length,100);
   assert.equal(writes.at(-1)[0].data.weapon_inventory['small-poison'],900);
   t.diagnostic(scope + ' 100 concurrent replies in ' + elapsed.toFixed(1) + ' ms');
  }
 } finally {
  if (previous === undefined) delete process.env.COMBAT_BACKGROUND_WRITES;
  else process.env.COMBAT_BACKGROUND_WRITES = previous;
 }
});
