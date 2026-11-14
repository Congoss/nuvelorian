import test from 'node:test';
import assert from 'node:assert/strict';
import { openShipBattle } from '../src/lib/openShipBattle.js';
const target={playerId:'p',clanId:'c',moduleId:'hull'};
function options(){const values=new Map();return {requestId:()=> 'request-123456789',storage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},values};}
test('entry waits for authoritative open and never resolves when another boss is active',async()=>{
 const o=options();let reject;
 const api={clanShipCombat:()=>new Promise((_,fail)=>{reject=fail;})};
 let entered=false;
 const pending=openShipBattle(api,target,o).then(()=>{entered=true;});
 assert.equal(entered,false);
 reject(Object.assign(new Error('Finish current fight'),{status:409,code:'BOSS_FIGHT_ALREADY_ACTIVE'}));
 await assert.rejects(pending,error=>error.code==='BOSS_FIGHT_ALREADY_ACTIVE');
 assert.equal(entered,false);assert.equal(o.values.size,0);
});
test('a dropped response reuses the same request; success passes the opened fight to the scene',async()=>{
 const o=options(),bodies=[];let attempt=0;
 const response={fight:{id:'shared-fight',moduleId:'hull'},player:{id:'p'}};
 const api={clanShipCombat:async(clan,command,body)=>{assert.equal(clan,'c');assert.equal(command,'open');bodies.push(body);if(!attempt++)throw Error('offline');return response;}};
 await assert.rejects(openShipBattle(api,target,o),/offline/);
 assert.equal(o.values.size,1);
 assert.equal(await openShipBattle(api,target,o),response);
 assert.deepEqual(bodies[0],bodies[1]);assert.equal(o.values.size,0);
});
test('joining an invitation pins the expected fight instead of reusing a stale request',async()=>{
 const o=options();o.values.set('ship-attack:p:c:hull:open',JSON.stringify({requestId:'old-request',moduleId:'hull'}));
 await openShipBattle({clanShipCombat:async(_,__,body)=>{assert.equal(body.fightId,'expected');return {fight:{id:'expected'}};}},{...target,expectedFightId:'expected'},o);
});
