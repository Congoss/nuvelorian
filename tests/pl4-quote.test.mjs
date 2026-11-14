import test from 'node:test';
import assert from 'node:assert/strict';
import {createPl4QuoteService} from '../server/services/pl4-quote.js';
const quote={token:'pl4.nearlytrade.near',price_usd:0.00000956,change_24h:-0.00659};
test('PL4 quote validates token, shares requests, caches and bounds stale fallback',async()=>{
 let clock=1000,calls=0,fail=false,release;
 const service=createPl4QuoteService({now:()=>clock,fetchImpl:async()=>{calls++;if(release)await new Promise(r=>release=r);if(fail)throw Error('offline');return {ok:true,json:async()=>quote};}});
 const [a,b]=await Promise.all([service(),service()]);assert.equal(calls,1);assert.equal(a,b);assert.equal(a.change_24h,-0.00659);assert.equal(a.price_usd,0.00000956);
 clock+=59000;await service();assert.equal(calls,1);
 clock+=2000;fail=true;assert.equal((await service()).stale,true);
 clock+=300000;await assert.rejects(service(),/unavailable/);
});
test('invalid prices and wrong contracts never become quotes; missing change stays unknown',async()=>{
 for(const data of [{...quote,token:'other.near'},{...quote,price_usd:null},{...quote,price_usd:0},{...quote,price_usd:'0.1'}]){
  const s=createPl4QuoteService({fetchImpl:async()=>({ok:true,json:async()=>data})});await assert.rejects(s(),/unavailable/);
 }
 const s=createPl4QuoteService({fetchImpl:async()=>({ok:true,json:async()=>({...quote,change_24h:null})})});assert.equal((await s()).change_24h,null);
});
