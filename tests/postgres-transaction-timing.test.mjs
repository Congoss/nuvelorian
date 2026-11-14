import test from 'node:test';
import assert from 'node:assert/strict';
import {runPostgresTransaction} from '../server/data/postgres.js';

test('transaction stages are timed while statements remain parameterized and commit precedes release',async()=>{
 const calls=[],timings=[];
 const pool={connect:async()=>({query:async(text,values)=>{calls.push([text,values]);return {rows:[{ok:true}]};},release:()=>calls.push(['release'])})};
 const result=await runPostgresTransaction(pool,async sql=>sql`SELECT value WHERE id=${'untrusted'}`,{onTiming:(name,duration)=>{timings.push(name);assert(duration>=0);}});
 assert.deepEqual(result,[{ok:true}]);
 assert.deepEqual(calls,[['BEGIN',undefined],['SELECT value WHERE id=$1',['untrusted']],['COMMIT',undefined],['release']]);
 assert.deepEqual(timings,['tx_pool','tx_begin','tx_commit']);
});

test('failed writes roll back and release without recording a successful commit',async()=>{
 const calls=[],timings=[];
 const pool={connect:async()=>({query:async text=>{calls.push(text);return {rows:[]};},release:()=>calls.push('release')})};
 await assert.rejects(runPostgresTransaction(pool,async()=>{throw Error('write failed');},{onTiming:name=>timings.push(name)}),/write failed/);
 assert.deepEqual(calls,['BEGIN','ROLLBACK','release']);assert(!timings.includes('tx_commit'));
});
