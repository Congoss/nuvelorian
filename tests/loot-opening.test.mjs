import test from 'node:test';
import assert from 'node:assert/strict';
import {openLootReward} from '../src/lib/lootOpening.js';

test('ready loot has no animation wait and cannot appear before authoritative claim', async()=>{
 let save; const events=[];
 const pending=openLootReward({open:async()=>[{id:'artifact',qty:1}],apply:()=>new Promise(resolve=>{events.push('claim');save=resolve;})});
 let displayed=false;void pending.then(()=>{displayed=true;});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(displayed,false);assert.deepEqual(events,['claim']);
 save();assert.deepEqual(await pending,[{id:'artifact',qty:1}]);assert.equal(displayed,true);
});
test('claim errors propagate without presenting unsaved loot',async()=>{
 const error=Object.assign(Error('storage unavailable'),{code:'STORAGE_UNAVAILABLE'});
 await assert.rejects(openLootReward({open:()=>[],apply:()=>{throw error;}}),error);
});
test('deadline also covers a claim that never returns',async()=>{
 await assert.rejects(openLootReward({open:()=>[],apply:()=>new Promise(()=>{}),timeoutMs:15}),{code:'CHEST_TIMEOUT'});
});
test('late lookup after timeout never starts an additional reward claim',async()=>{
 let release,calls=0;
 const pending=openLootReward({open:()=>new Promise(resolve=>release=resolve),apply:()=>{calls++;},timeoutMs:10});
 await assert.rejects(pending,{code:'CHEST_TIMEOUT'});
 release([]);await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,0);
});
