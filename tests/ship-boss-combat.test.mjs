import test from 'node:test';
import assert from 'node:assert/strict';
import { attackShipBoss, createShipBossCombat, tickShipBossCombat } from '../src/lib/shipBossCombat.js';
const profile={talent_tree_version:2,talent_levels:{}};
test('x5 poison applies five hits and consumes five doses',()=>{
 const hit=attackShipBoss(createShipBossCombat(1000),'satchel',5,1000,profile,()=>1);
 assert.equal(hit.hp,825);assert.equal(hit.stock['small-poison'],95);assert.equal(hit.hits,5);
});
test('finger uses normal damage and cooldown, without consuming poison',()=>{
 const initial=createShipBossCombat(1000);
 const hit=attackShipBoss(initial,'fist',1,1000,profile,()=>1);
 assert.equal(hit.hp,980);assert.deepEqual(hit.stock,initial.stock);
 assert.equal(hit.cooldowns.fist,601000);
 assert.equal(attackShipBoss(hit,'fist',1,2000,profile),hit);
 assert.equal(attackShipBoss(hit,'fist',1,601000,profile,()=>1).hp,960);
});
test('poison uses inventory per dose and rejects insufficient stock',()=>{
 const initial=createShipBossCombat(1000);
 const hit=attackShipBoss(initial,'satchel',10,1000,profile,()=>1);
 assert.equal(hit.hp,650);assert.equal(hit.stock['small-poison'],90);
 assert.equal(hit.hits,10);assert.equal(hit.runtime.toxicMarks,5);
 assert.equal(attackShipBoss(hit,'satchel',100,2000,profile),hit);
});
test('pencil applies normal six-second bleed, paid only once',()=>{
 const hit=attackShipBoss(createShipBossCombat(1000),'knuckle',1,1000,profile,()=>1);
 assert.equal(hit.hp,950);
 const tick=tickShipBossCombat(hit,7000);
 assert.equal(tick.hp,920);assert.equal(tick.runtime.bleed,null);
 assert.equal(tickShipBossCombat(tick,8000),tick);
});
test('victory clamps damage and cannot be attacked again',()=>{
 const initial=createShipBossCombat(1000);
 const hit=attackShipBoss(initial,'c4',10,1000,profile,()=>1);
 assert.equal(hit.hp,0);assert.equal(hit.damage,1000);
 assert.equal(attackShipBoss(hit,'c4',1,2000,profile),hit);
});

test('ship HP starts at two million and rises by two million per sector',()=>{
 assert.equal(createShipBossCombat().maxHp,2000000);
 for(let level=1;level<=14;level++){const state=createShipBossCombat(level*2000000);assert.equal(state.hp,level*2000000);assert.equal(state.maxHp,state.hp);}
});
