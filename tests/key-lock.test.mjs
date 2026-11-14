import test from 'node:test';
import assert from 'node:assert/strict';
import { acquireKeyLock,withKeyLock } from '../server/utils/keyLock.js';
test('FIFO lock serializes one key, lets other players proceed and releases after failure',async()=>{
 const release=await acquireKeyLock('a'),events=[];
 const first=withKeyLock('a',async()=>{events.push(1);throw Error('expected')});
 const second=withKeyLock('a',async()=>events.push(2));
 await withKeyLock('b',async()=>events.push('other'));
 assert.deepEqual(events,['other']);release();release();await assert.rejects(first,/expected/);await second;
 assert.deepEqual(events,['other',1,2]);await withKeyLock('a',async()=>events.push(3));assert.equal(events.at(-1),3);
});
