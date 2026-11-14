import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateBossReward,getStandardBossRewardFund} from '../src/lib/bossRewardSystem.js';
const amounts=result=>Object.fromEntries(result.drops.map(d=>[d.type,d.qty]));
const reward=(bossId,maxHp,share=1,extra={})=>calculateBossReward({bossId,maxHp,actualDamageTotal:maxHp*share,rank:1,rng:()=>1,availableSpecials:[],...extra});
test('reviewed standard boss maximums and starter tentacle exceptions',()=>{
 assert.equal(amounts(reward('heli',1000)).tentacles,3271);
 assert.equal(amounts(reward('tank',10000)).tentacles,37238);
 assert.equal(amounts(reward('heli',1000)).energy,28);
 assert.equal(amounts(reward('tank',10000)).energy,168);
 assert.equal(amounts(reward('chinook',50000)).tentacles,548106);
 assert.equal(amounts(reward('chinook',50000)).energy,1095);
 assert.equal(amounts(reward('boss9',5000000)).tentacles,5481067);
});
test('participants share the resource fund without extra participation rewards',()=>{
 const fund=getStandardBossRewardFund(3000000);
 const rewards=[.1,.2,.7].map(share=>amounts(reward('boss7',3000000,share)));
 for(const key of Object.keys(fund))assert(rewards.reduce((sum,r)=>sum+(r[key]||0),0)<=fund[key]);
 const full=amounts(reward('boss7',3000000)),reduced=amounts(reward('boss7',3000000,1,{dailyKillNumber:101}));
 for(const key of Object.keys(fund))assert.equal(reduced[key],Math.floor(full[key]*.1));
});
