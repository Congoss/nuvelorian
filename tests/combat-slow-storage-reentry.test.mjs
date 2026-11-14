import test from 'node:test';
import assert from 'node:assert/strict';
import { executeWorldCombat } from '../server/services/world-combat.js';
import { createWriteQueue } from '../server/utils/writeQueue.js';

test('normal fight survives blocked background SQL, re-entry, lethal hit and replay', async () => {
  const prior = process.env.COMBAT_BACKGROUND_WRITES;
  process.env.COMBAT_BACKGROUND_WRITES = '1';
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  const durable = [];
  const queue = createWriteQueue(async () => {});
  const player = { id:'slow-player',created_by:'slow@game',weapon_inventory:{'small-poison':12},pending_boss_boxes:[] };
  const fight = { id:'slow-fight',opened_by_email:'slow@game',status:'active',current_hp:200 };
  const store = {players:[player],clans:[],bossFights:[fight],bossDamageLogs:[],claimedLoot:[],raidBoss:{participants:{}},
    queueCombatInBackground(work) { return work(async (_draft,players,changes) => {
      const packet=structuredClone({players,changes});
      void queue.exclusive(async () => { await blocked; durable.push(packet); });
    }); },
  };
  const playerDb={toDbPlayerRecord(p){return {id:p.id,data:p};},buildPlayerProgress(p){return {inventory:p.weapon_inventory};},acknowledgeCommittedPlayer(){}};
  const hit = id => executeWorldCombat({store,playerDb,actorId:player.id,body:{requestId:id,weaponId:'satchel',multiplier:1},scope:'boss:slow-fight',
    calculate(response){
      const p=store.players[0], f=store.bossFights[0];
      p.weapon_inventory['small-poison']--;
      f.current_hp=Math.max(0,f.current_hp-100);
      f.combat_revision=(f.combat_revision||0)+1;
      if(f.current_hp===0){f.status='dead';p.pending_boss_boxes.push({instanceId:'chest-slow-fight'});}
      response.writeHead(200,{});response.end(JSON.stringify({fight:f,player:p}));
    },
  });
  try {
    const first=await hit('hit-1');
    assert.equal(first.statusCode,200);
    assert.equal(store.bossFights[0].current_hp,100);
    for(let i=0;i<10;i++) assert.equal(store.bossFights.find(x=>x.id==='slow-fight').current_hp,100);
    assert.equal((await hit('hit-1')).body,first.body);
    await hit('hit-2');
    assert.equal(store.bossFights[0].current_hp,0);
    assert.equal(store.bossFights[0].status,'dead');
    assert.equal(store.players[0].weapon_inventory['small-poison'],10);
    assert.equal(store.players[0].pending_boss_boxes.length,1);
    assert.equal(store.players[0].combat_receipts.length,2);
    await hit('hit-2');
    assert.equal(store.players[0].pending_boss_boxes.length,1);
  } finally { release(); if(prior===undefined) delete process.env.COMBAT_BACKGROUND_WRITES; else process.env.COMBAT_BACKGROUND_WRITES=prior; }
  await queue.exclusive(async()=>{});
  const last=durable.at(-1);
  assert.equal(last.changes.find(x=>x.entity_type==='bossFights').state.current_hp,0);
  assert.equal(last.players[0].data.weapon_inventory['small-poison'],10);
  assert.equal(last.players[0].data.combat_receipts.length,2);
  assert.equal(last.players[0].data.pending_boss_boxes.length,1);
});
