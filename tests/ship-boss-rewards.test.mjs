import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateShipBossReward,getShipBossRewardFund } from '../src/lib/shipBossRewards.js';
const options={level:1,bossId:'ship-hull',maxHp:2000000,rank:1,rng:()=>1};
test('ship reward funds match the reviewed maximums and stay a shared cap',()=>{
 const first=getShipBossRewardFund(1);assert.deepEqual(first,{tentacles:1540681,xp:15416,strength:3081,energy:6162});
 assert.equal(getShipBossRewardFund(14).tentacles,5764700);
 const solo=calculateShipBossReward({...options,actualDamageTotal:2000000});
 for(const [type,max] of Object.entries(first))assert.equal(solo.drops.find(d=>d.type===type).qty,Math.floor(max * (type === 'energy' || type === 'tentacles' ? 0.75 : 1)));
 const participants=[.4,.3,.2,.1].map((share,i)=>calculateShipBossReward({...options,rank:i+1,actualDamageTotal:2000000*share}));
 for(const [type,max] of Object.entries(first))assert(participants.reduce((sum,r)=>sum+Number(r.drops.find(d=>d.type===type)?.qty||0),0)<=max);
});
test('funds split by damage without multiplying the reviewed cap again',()=>{
 const a=calculateShipBossReward({...options,actualDamageTotal:1000000}),b=calculateShipBossReward({...options,actualDamageTotal:2000000});
 for(const type of ['tentacles','xp','strength','energy'])assert.equal(a.drops.find(d=>d.type===type).qty,Math.floor(b.drops.find(d=>d.type===type).qty/2));
 const reduced=calculateShipBossReward({...options,actualDamageTotal:2000000,dailyKillNumber:11});assert(reduced.drops.find(d=>d.type==='tentacles').qty<b.drops.find(d=>d.type==='tentacles').qty);
});
test('cashback is separate from the resource fund and follows actual spent poison',()=>{
 const r=calculateShipBossReward({...options,actualDamageTotal:2000000,poisonRefundUnits:{large:100}});
 assert.equal(r.drops.find(d=>d.type==='weapon').qty,25);
 assert(!calculateShipBossReward({...options,actualDamageTotal:2000000}).drops.some(d=>d.type==='weapon'));
});
