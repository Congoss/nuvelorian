import test from 'node:test';
import assert from 'node:assert/strict';
import { rollShipEnhancementGum,grantEnhancementGum } from '../server/utils/enhancementGumRewards.js';
import { ensureShip,tickShipFight } from '../server/utils/clanShip.js';
test('personal gum roll requires 1% damage, has 5% ordinary and 1% improved, no premium',()=>{
 for(const [roll,expected] of [[0,'normal'],[.049999,'normal'],[.05,'improved'],[.059999,'improved'],[.060001,null],[.99,null]])assert.equal(rollShipEnhancementGum({damage:20000,maxHp:2000000,rng:()=>roll})?.gum||null,expected);
 assert.equal(rollShipEnhancementGum({damage:19999,maxHp:2000000,rng:()=>0}),null);
 assert.equal(rollShipEnhancementGum({damage:0,maxHp:0,rng:()=>0}),null);
});
test('multiple eligible clan members can each win gum, settlement cannot reroll it',()=>{
 const now=Date.now(),clan={},ship=ensureShip(clan),players=[{id:'a'},{id:'b'},{id:'c'}];
 const fight={id:'gum-fight',moduleId:'hull',boss_id:'ship-hull',status:'active',current_hp:5,max_hp:2000000,participants:{a:{name:'a',damage:1000000,hits:1,refund:{},runtime:{bleed:{damage:5,lastTickAt:now-1000,expiresAt:now+1000}}},b:{name:'b',damage:999994,hits:1,refund:{},runtime:{}},c:{name:'c',damage:1,hits:1,refund:{},runtime:{}}}};
 ship.fights.hull=fight;tickShipFight(clan,fight,players,{now,rng:()=>0});
 for(const p of players.slice(0,2))assert.equal(p.pending_boss_boxes[0].rewardSnapshot.filter(d=>d.type==='enhancement_gum').length,1);
 assert(!players[2].pending_boss_boxes?.some(box=>box.rewardSnapshot.some(d=>d.type==='enhancement_gum')));
 const snapshot=JSON.stringify(players);tickShipFight(clan,fight,players,{now:now+1000,rng:()=>0});assert.equal(JSON.stringify(players),snapshot);assert.equal(ship.kills.hull,1);
});
test('gum rewards use a real player inventory and validate quantities',()=>{
 const p={};grantEnhancementGum(p,{type:'enhancement_gum',gum:'normal',qty:1});assert.deepEqual(p.enhancement_gums,{normal:1,improved:0,premium:0});
 assert.throws(()=>grantEnhancementGum(p,{type:'enhancement_gum',gum:'fake',qty:1}));assert.throws(()=>grantEnhancementGum(p,{type:'enhancement_gum',gum:'normal',qty:-1}));
});
