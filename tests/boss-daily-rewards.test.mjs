import test from 'node:test';
import assert from 'node:assert/strict';
import {getBossDailyRewardMultiplier, getBossDailyRewardState, calculateBossReward} from '../src/lib/bossRewardSystem.js';

test('gear, pets and backgrounds still drop at the daily reduction floor',()=>{
 for(const [kind,type] of [['gear','boss_gear_piece'],['pet','boss_pet'],['background','boss_background']]){
  const options={bossId:'boss4',maxHp:100000,actualDamageTotal:100000,rank:1,availableSpecials:[kind]};
  const roll=(dailyKillNumber)=>{
   const values=[0.5,0.5,0.005,0];
   return calculateBossReward({...options,dailyKillNumber,rng:()=>values.shift() ?? 0});
  };
  const full=roll(1),reduced=roll(1000);
  assert.equal(reduced.dailyMultiplier,0.1);
  assert.equal(reduced.specialChance,full.specialChance);
  assert.deepEqual(reduced.drops.filter(x=>x.type===type),full.drops.filter(x=>x.type===type));
  assert.equal(reduced.drops.filter(x=>x.type===type).length,1);
 }
});
test('standard daily farm starts after personal gold and ignores pre-gold victories',()=>{
 const now=Date.parse('2026-10-27T12:00:00Z');let state;
 for(let kills=0;kills<100;kills++){
  const result=getBossDailyRewardState(state,'chinook',now,kills);
  assert.equal(result.multiplier,1);assert.equal(result.state.counts.chinook,undefined);state=result.state;
 }
 for(let kills=100;kills<=110;kills++){
  const result=getBossDailyRewardState(state,'chinook',now,kills);state=result.state;
  assert.equal(result.multiplier,kills===110?0.9:1);
 }
 assert.equal(getBossDailyRewardState(state,'tank',now,99).multiplier,1);
 assert.equal(getBossDailyRewardState(state,'chinook',now+86400000,111).killNumber,1);
});
test('daily boss reduction starts at eleven, has a floor, resets at Kyiv midnight and isolates bosses',()=>{
assert.equal(getBossDailyRewardMultiplier(10),1);assert.equal(getBossDailyRewardMultiplier(11),0.9);assert.equal(getBossDailyRewardMultiplier(20),0.9);assert.equal(getBossDailyRewardMultiplier(21),0.8);assert.equal(getBossDailyRewardMultiplier(90),0.2);assert.equal(getBossDailyRewardMultiplier(91),0.1);assert.equal(getBossDailyRewardMultiplier(1000),0.1);
let result;let state;for(let i=0;i<11;i++){result=getBossDailyRewardState(state,'first',Date.parse('2026-10-20T20:59:59Z'));state=result.state;}
assert.equal(result.multiplier,0.9);assert.equal(getBossDailyRewardState(state,'second',Date.parse('2026-10-20T20:59:59Z')).killNumber,1);assert.equal(getBossDailyRewardState(state,'first',Date.parse('2026-10-20T21:00:00Z')).killNumber,1);
});
test('reduction scales resources but preserves rare chance, keys and first kill bonuses',()=>{
const options={bossId:'first',maxHp:1000,actualDamageTotal:1000,rank:1,rng:()=>0.5,firstKillDrops:[{type:'strength',qty:25}],pityDrops:[{type:'keycard',qty:1}]};
const full=calculateBossReward(options),reduced=calculateBossReward({...options,dailyKillNumber:11});
assert.equal(reduced.dailyMultiplier,0.9);assert.ok(reduced.drops.find(x=>x.type==='tentacles').qty<full.drops.find(x=>x.type==='tentacles').qty);assert.equal(reduced.specialChance,full.specialChance);assert.deepEqual(reduced.drops.filter(x=>x.type==='keycard'),[{type:'keycard',qty:1}]);assert.equal(reduced.drops.filter(x=>x.type==='strength').at(-1).qty,full.drops.filter(x=>x.type==='strength').at(-1).qty);
});
