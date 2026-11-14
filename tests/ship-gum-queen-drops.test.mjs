import test from 'node:test';
import assert from 'node:assert/strict';
import {rollShipEnhancementGum} from '../server/utils/enhancementGumRewards.js';
import {getShipGumDropRates} from '../src/lib/shipGumDrops.js';
import {ensureShip,tickShipFight} from '../server/utils/clanShip.js';
const roll=(moduleId,value,damage=10)=>rollShipEnhancementGum({moduleId,damage,maxHp:1000,rng:()=>value})?.gum??null;
test('Queen gets 10% ordinary and 2% improved, only at her sector',()=>{
 assert.equal(getShipGumDropRates('portal').normalChance,.10);
 assert.equal(getShipGumDropRates('portal').improvedChance,.02);
 assert.equal(roll('portal',.099999),'normal');assert.equal(roll('portal',.10),'improved');assert.equal(roll('portal',.119999),'improved');assert.equal(roll('portal',.120001),null);
 assert.equal(roll('ship-portal',.11),'improved');
 for(const id of ['hull','engine','hangar','core',undefined]){assert.equal(roll(id,.049999),'normal');assert.equal(roll(id,.05),'improved');assert.equal(roll(id,.060001),null);}
});
test('Queen still requires 1% damage and awards at most one gum',()=>{
 assert.equal(roll('portal',0,9),null);
 assert.deepEqual(rollShipEnhancementGum({moduleId:'portal',damage:10,maxHp:1000,rng:()=>.11}),{type:'enhancement_gum',id:'improved',gum:'improved',qty:1});
});
test('Queen settlement uses her rates and never rerolls a paid reward',()=>{
 const now=Date.now(),clan={},ship=ensureShip(clan),player={id:'queen-fighter'};
 const fight={id:'queen-fight',moduleId:'portal',boss_id:'ship-portal',status:'active',current_hp:5,max_hp:8000000,participants:{'queen-fighter':{name:'Fighter',damage:7999995,hits:1,refund:{},runtime:{bleed:{damage:5,lastTickAt:now-1000,expiresAt:now+1000}}}}};
 ship.fights.portal=fight;tickShipFight(clan,fight,[player],{now,rng:()=>.11});
 assert.deepEqual(player.pending_boss_boxes[0].rewardSnapshot.filter(d=>d.type==='enhancement_gum'),[{type:'enhancement_gum',id:'improved',gum:'improved',qty:1}]);
 const before=JSON.stringify(player);tickShipFight(clan,fight,[player],{now:now+1000,rng:()=>0});assert.equal(JSON.stringify(player),before);
});
