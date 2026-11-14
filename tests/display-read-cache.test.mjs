import test from 'node:test';
import assert from 'node:assert/strict';
import {createReadCache,selectChatMessages} from '../src/lib/displayReadCache.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('stale display data returns without waiting for a slow refresh and refreshes only once',async()=>{
 let now=0,calls=0,finish;const cache=createReadCache({ttl:10,now:()=>now});
 assert.equal(await cache.get('a',async()=>{calls++;return 'old';}),'old');
 now=20;
 const load=()=>{calls++;return new Promise(resolve=>{finish=resolve;});};
 assert.equal(await cache.get('a',load),'old');
 assert.equal(await cache.get('a',load),'old');
 assert.equal(calls,2);
 finish('new');await tick();assert.equal(cache.peek('a'),'new');
});
test('separate viewer/clan keys and invalidation cannot resurrect old responses',async()=>{
 const cache=createReadCache();let finish;
 const pending=cache.get('p1:clan1',()=>new Promise(resolve=>{finish=resolve;}));await tick();
 cache.clear();cache.set('p2:clan2',['private']);finish(['old']);await pending;
 assert.equal(cache.peek('p1:clan1'),undefined);
 assert.deepEqual(cache.peek('p2:clan2'),['private']);
});
test('chat preview limits retain the newest patch without mutating the cached list',()=>{
 const patch={id:'patch',releaseVersion:'3.51',created_at:'2026-01-01'};
 const messages=[patch,...Array.from({length:99},(_,i)=>({id:'m'+i,created_at:'2026-02-01'}))];
 const selected=selectChatMessages(messages,40);
 assert.equal(selected.length,40);assert.equal(selected[0],patch);assert.equal(messages.length,100);
 assert.equal(selected.at(-1).id,'m98');
});
