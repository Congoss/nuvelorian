import test from 'node:test';import assert from 'node:assert/strict';
import {recoverShipAttack} from '../src/lib/shipAttackRecovery.js';

test('a bounded background retry reuses the original request and releases the queue on failure', async()=>{
 const body={requestId:'same-hit'};
 const sent=[];
 const offline=new Error('Offline');
 await assert.rejects(recoverShipAttack(async request=>{
  sent.push(request);
  throw offline;
 },body,{maxRetries:1,wait:async()=>{}}),offline);
 assert.deepEqual(sent,[body,body]);
});
import {SHIP_MODULES} from '../src/lib/clanShipPreview.js';
import {ensureShip,openShipFight,attackShipFight} from '../server/utils/clanShip.js';
test('lost response automatically replays the accepted hit without spending twice',async()=>{
 const clan={id:'recovery',name:'Recovery'},ship=ensureShip(clan);for(const module of SHIP_MODULES.slice(0,3))ship.progress[module.id]=module.cost;ship.kills.engine=1;
 const player={id:'p',created_by:'p@test',nickname:'P',level:80,talent_tree_version:2,talent_levels:{},inventory_items:[],equipped_items:{},weapon_inventory:{'large-poison':10},weapon_cooldowns:{}};
 const now=Date.parse('2026-10-30T12:00:00Z');const opened=openShipFight(clan,player,{requestId:'recovery-open-0001',moduleId:'hangar'},now);
 const body={requestId:'recovery-hit-00001',moduleId:'hangar',fightId:opened.fightId,weaponId:'c4',multiplier:5};let calls=0,damage;
 const result=await recoverShipAttack(async saved=>{assert.equal(saved,body);const result=attackShipFight(clan,player,[player],saved,{now,rng:()=>.99});if(++calls===1){damage=result.damage;throw new TypeError('Failed to fetch');}return result;},body,{wait:async()=>{}});
 assert.equal(calls,2);assert.equal(result.damage,damage);assert.equal(player.weapon_inventory['large-poison'],5);assert.equal(ship.fights.hangar.current_hp,6000000-damage);
});
test('timeouts, throttling and server failures recover with bounded backoff and stable ID',async()=>{
 const errors=[{code:'SHIP_REQUEST_TIMEOUT'},{status:429},{status:503}];let calls=0;const delays=[],body={requestId:'same-request'};
 const result=await recoverShipAttack(async saved=>{assert.equal(saved.requestId,'same-request');if(calls<errors.length)throw errors[calls++];return 'ok';},body,{wait:async ms=>delays.push(ms)});
 assert.equal(result,'ok');assert.deepEqual(delays,[500,1000,2000]);
});
test('definitive validation failures are not retried and leaving stops recovery',async()=>{
 let calls=0;await assert.rejects(recoverShipAttack(async()=>{calls++;throw Object.assign(Error('empty'),{status:400});},{},{wait:async()=>{}}));assert.equal(calls,1);
 const controller=new AbortController();await assert.rejects(recoverShipAttack(async()=>{throw Error('offline');},{},{signal:controller.signal,wait:async()=>controller.abort()}),{name:'AbortError'});
});
