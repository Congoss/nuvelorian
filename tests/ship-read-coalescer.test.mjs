import test from 'node:test';
import assert from 'node:assert/strict';
import {coalesceShipRead,primeShipRead,refreshShipSnapshot} from '../server/utils/shipReadCoalescer.js';

test('an in-flight read cannot replace committed ship damage', async () => {
 const clan = {ship:{hp:100}};
 let complete;
 const pending = refreshShipSnapshot(clan, () => new Promise(resolve => { complete = resolve; }));
 clan.ship = {hp:80};
 primeShipRead(clan);
 complete({hp:100});
 await pending;
 assert.equal(clan.ship.hp,80);
 await refreshShipSnapshot(clan, async () => ({hp:70}));
 assert.equal(clan.ship.hp,70);
});
test('concurrent ship display reads share work, expire, and invalidate after mutation',async()=>{
 const clan={ship:{}},other={ship:{}};let calls=0,stamp=0;
 const load=async()=>{calls++;clan.ship={version:calls};};const options={now:()=>stamp};
 await Promise.all(Array.from({length:20},()=>coalesceShipRead(clan,load,options)));assert.equal(calls,1);
 await coalesceShipRead(clan,load,options);assert.equal(calls,1);
 clan.ship={changed:true};await coalesceShipRead(clan,load,options);assert.equal(calls,2);
 stamp=1000;await coalesceShipRead(clan,load,options);assert.equal(calls,3);
 await coalesceShipRead(other,async()=>{calls++;},options);assert.equal(calls,4);
});
test('failed ship read is retryable',async()=>{const clan={};await assert.rejects(coalesceShipRead(clan,async()=>{throw Error('offline');}));let loaded=false;await coalesceShipRead(clan,async()=>{loaded=true;});assert(loaded);});

test('committed combat primes short-lived reads, then expires or invalidates normally',async()=>{
 const clan={ship:{hp:100}},options={now:()=>0};let reads=0;
 primeShipRead(clan,options);
 const load=async()=>{reads++;};
 await coalesceShipRead(clan,load,options);assert.equal(reads,0);
 clan.ship={hp:90};primeShipRead(clan,options);
 await coalesceShipRead(clan,load,{now:()=>749});assert.equal(reads,0);
 await coalesceShipRead(clan,load,{now:()=>750});assert.equal(reads,1);
 clan.ship={external:true};await coalesceShipRead(clan,load,options);assert.equal(reads,2);
});
