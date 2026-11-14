import test from 'node:test';import assert from 'node:assert/strict';
import {projectPoisonTap} from '../src/lib/instantPoisonCombat.js';import {createPoisonAttackQueue} from '../src/lib/poisonAttackQueue.js';
const initial=()=>({fight:{id:'f',status:'active',current_hp:100000,max_hp:100000},profile:{talent_tree_version:2,talent_levels:{},weapon_inventory:{'small-poison':10},weapon_cooldowns:{},talent_combat_state:{}},damageLog:{damage:0,hits:0}});
test('finger and pencil apply locally while a previous poison request is still waiting',async()=>{
 let view=initial(),release;const sent=[];const queue=createPoisonAttackQueue({send:async entry=>{sent.push(entry.weapon.id);if(sent.length===1)await new Promise(resolve=>{release=resolve;});return {fight:{status:'active'}};},onChange:()=>{}});
 const now=Date.parse('2026-10-30T12:00:00Z');
 for(const id of ['satchel','fist','knuckle']){const next=projectPoisonTap(view,{weaponId:id,mode:'ship',now});assert(next,id);view=next;assert(queue.enqueue({weapon:{id},multiplier:1,fightId:'f'},10));await Promise.resolve();}
 assert.deepEqual(sent,['satchel']);assert.equal(queue.size,3);assert(view.fight.current_hp<100000);assert.equal(view.profile.weapon_cooldowns.fist,new Date(now).toISOString());assert.equal(view.profile.weapon_cooldowns.knuckle,new Date(now).toISOString());
 assert.equal(projectPoisonTap(view,{weaponId:'fist',now:now+1000}),null);assert.equal(projectPoisonTap(view,{weaponId:'knuckle',now:now+1000}),null);
 release();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(sent,['satchel','fist','knuckle']);assert.equal(queue.size,0);
});
test('basic taps preserve poison stock, server state and real cooldown requirements',()=>{
 const base=initial(),now=Date.parse('2026-10-30T12:00:00Z');const next=projectPoisonTap(base,{weaponId:'fist',now});
 assert.equal(next.profile.weapon_inventory['small-poison'],10);assert.deepEqual(base.profile.weapon_cooldowns,{});
 assert.equal(projectPoisonTap(next,{weaponId:'fist',count:5,now:now+600000}),null);
 assert(projectPoisonTap(next,{weaponId:'fist',now:now+600000}));
});
