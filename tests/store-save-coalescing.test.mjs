import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('server/data/store.js','utf8');
const method=source.slice(source.indexOf('  async persistNow() {'),source.indexOf('  async refreshRaidBoss() {'));
test('explicit save cancels a redundant scheduled snapshot but preserves a later save',async()=>{
 const cancelled=[],runtime={saveTimer:123};let writes=0;
 const context=vm.createContext({runtime,clearTimeout:id=>cancelled.push(id),getDatabaseUrl:()=>true,queueStateSave:async()=>{writes++;runtime.saveTimer=456;return true;}});
 vm.runInContext('globalThis.store={'+method+'};',context);
 await context.store.persistNow();
 assert.deepEqual(cancelled,[123]);assert.equal(writes,1);assert.equal(runtime.saveTimer,456);
});
