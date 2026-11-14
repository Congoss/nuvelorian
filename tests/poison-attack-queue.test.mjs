import test from 'node:test';
import assert from 'node:assert/strict';
import { createPoisonAttackQueue, canCombinePoisonTaps } from '../src/lib/poisonAttackQueue.js';
import {SKELETON_BP_EQUIPMENT} from '../src/lib/skeletonBattlePassSet.js';
const tick = () => new Promise(resolve => setImmediate(resolve));
const attack = (weaponId = 'satchel', multiplier = 1, fightId = 'boss') => ({ weapon: { id: weaponId }, multiplier, fightId });

test('optimization never merges per-press advanced effects, armor or Bone Curse rolls',()=>{
 assert.equal(canCombinePoisonTaps({}, {boss_id:'boss5'}),true);
 assert.equal(canCombinePoisonTaps({}, {boss_id:'boss8'}),false);
 for(const id of ['a12','a15','a19','a20'])assert.equal(canCombinePoisonTaps({talent_levels:{[id]:1}},{boss_id:'boss5'}),false);
 const equipped_items=Object.fromEntries(Object.values(SKELETON_BP_EQUIPMENT).map(item=>[item.slot,item.id]));
 assert.equal(canCombinePoisonTaps({equipped_items},{boss_id:'boss5'}),false);
 assert.equal(canCombinePoisonTaps({bone_curse:{expiresAt:123}},{boss_id:'boss5'}),false);
});

test('rapid taps reserve stock immediately while a slow request is outstanding', async () => {
  const sent = [], snapshots = [], releases = [];
  const queue = createPoisonAttackQueue({ send: entry => {
    sent.push(entry);
    return new Promise(resolve => releases.push(resolve));
  }, onChange: entries => snapshots.push(entries) });
  assert.ok(queue.enqueue(attack(), 2));
  assert.ok(queue.enqueue(attack(), 2));
  assert.equal(queue.enqueue(attack(), 2), null);
  assert.equal(queue.size, 2);
  assert.equal(snapshots.at(-1).length, 2);
  await tick();
  assert.equal(sent.length, 1);
  releases.shift()({ fight: { status: 'active' } });
  await tick();
  assert.equal(sent.length, 2);
  releases.shift()({ fight: { status: 'active' } });
  await tick();
  assert.equal(queue.size, 0);
  assert.equal(snapshots.at(-1).length, 0);
});

test('each tap keeps its own weapon and multiplier without cross-spending stock', async () => {
  const sent = [];
  const queue = createPoisonAttackQueue({ send: async entry => {
    sent.push([entry.weapon.id, entry.multiplier]); return { fight: { status: 'active' } };
  }, onChange: () => {} });
  assert.ok(queue.enqueue(attack('satchel', 5), 5));
  assert.equal(queue.enqueue(attack('satchel'), 5), null);
  assert.ok(queue.enqueue(attack('f4', 10), 10));
  await tick();
  assert.deepEqual(sent, [['satchel', 5], ['f4', 10]]);
});

test('each acknowledgement rebases only remaining taps, not the already paid hit',async()=>{
 const acknowledgements=[],releases=[];
 const queue=createPoisonAttackQueue({send:entry=>new Promise(resolve=>releases.push(resolve)),onChange:()=>{},onSettled:(entry,result,remaining)=>acknowledgements.push({token:entry.token,remaining:remaining.map(item=>item.token),result})});
 const small=queue.enqueue(attack('satchel',5),10),flask=queue.enqueue(attack('c4'),10);
 await tick();releases.shift()({fight:{id:'boss',status:'active',current_hp:800}});await tick();
 assert.deepEqual(acknowledgements[0].remaining,[flask.token]);assert.equal(acknowledgements[0].token,small.token);
 releases.shift()({fight:{id:'boss',status:'active',current_hp:400}});await tick();
 assert.deepEqual(acknowledgements[1].remaining,[]);assert.equal(queue.size,0);
});

test('uncertain failure never retries or sends the remaining doses', async () => {
  let sent = 0;
  const queue = createPoisonAttackQueue({ send: async () => { sent++; throw Error('timeout'); }, onChange: () => {} });
  queue.enqueue(attack(), 10); queue.enqueue(attack(), 10);
  await tick();
  assert.equal(sent, 1); assert.equal(queue.size, 0);
});

test('depleted small poison does not discard queued medium and large attacks',async()=>{
 const sent=[],settled=[];
 const queue=createPoisonAttackQueue({send:async entry=>{
  sent.push(entry.weapon.id);
  if(entry.weapon.id==='satchel')throw Object.assign(Error('empty'),{code:'NO_POISON_INVENTORY'});
  return {fight:{status:'active'}};
 },onChange:()=>{},onSettled:(entry,result,remaining,error)=>settled.push({remaining:remaining.map(x=>x.weapon.id),code:error?.code})});
 for(const id of ['satchel','satchel','f4','c4'])queue.enqueue(attack(id),10);
 await tick();
 assert.deepEqual(sent,['satchel','f4','c4']);
 assert.deepEqual(settled[0],{remaining:['f4','c4'],code:'NO_POISON_INVENTORY'});
 assert.equal(queue.size,0);
});

test('uncertain failure after a stock rejection still stops later mutations',async()=>{
 const sent=[];
 const queue=createPoisonAttackQueue({send:async entry=>{sent.push(entry.weapon.id);throw Object.assign(Error('failure'),{code:entry.weapon.id==='satchel'?'NO_POISON_INVENTORY':'NETWORK_ERROR'});},onChange:()=>{}});
 for(const id of ['satchel','f4','c4'])queue.enqueue(attack(id),10);
 await tick();assert.deepEqual(sent,['satchel','f4']);assert.equal(queue.size,0);
});

test('ship backlog batches adjacent equal poisons without changing total or weapon order',async()=>{
 const sent=[],releases=[],settled=[];
 const queue=createPoisonAttackQueue({batch:true,send:entry=>{sent.push([entry.weapon.id,entry.multiplier]);return new Promise(resolve=>releases.push(resolve));},onChange:()=>{},onSettled:(entry,result,remaining)=>settled.push(remaining.length)});
 queue.enqueue(attack('f4'),100);await tick();
 for(let i=0;i<15;i++)queue.enqueue(attack('f4'),100);
 queue.enqueue(attack('c4'),100);
 for(let i=0;i<5;i++)queue.enqueue(attack('f4'),100);
 while(queue.size){releases.shift()({fight:{status:'active'}});await tick();}
 assert.deepEqual(sent,[['f4',1],['f4',10],['f4',5],['c4',1],['f4',5]]);
 assert.equal(sent.filter(x=>x[0]==='f4').reduce((sum,x)=>sum+x[1],0),21);
 assert.deepEqual(settled,[21,11,6,5,0]);
});

test('eligible personal taps batch, while armored boss taps stay separate',async()=>{
 const sent=[];const queue=createPoisonAttackQueue({send:async entry=>{sent.push(entry.multiplier);return {fight:{status:'active'}};},onChange:()=>{}});
 for(let i=0;i<5;i++)queue.enqueue(attack(),10);
 await tick();assert.deepEqual(sent,[1,1,1,1,1]);
 const batched=createPoisonAttackQueue({batch:entry=>entry.allowBatch,send:async entry=>{sent.push(entry.multiplier);return {fight:{status:'active'}};},onChange:()=>{}});
 for(let i=0;i<5;i++)batched.enqueue({...attack(),allowBatch:true},10);
 await tick();assert.deepEqual(sent,[1,1,1,1,1,5]);
});

test('victory and leaving the fight discard unsent taps', async () => {
  let sent = 0;
  const queue = createPoisonAttackQueue({ send: async () => { sent++; return { fight: { status: 'dead' } }; }, onChange: () => {} });
  queue.enqueue(attack(), 10); queue.enqueue(attack(), 10);
  await tick();
  assert.equal(sent, 1); assert.equal(queue.size, 0);
  queue.enqueue(attack(), 10); queue.clear();
  await tick();
  assert.equal(sent, 1);
});
