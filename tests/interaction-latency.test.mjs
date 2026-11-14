import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { expireStaleBossFights } from '../server/utils/clanBossDamage.js';

test('boss expiry indexes players once and skips historical fights', () => {
  let reads = 0;
  const players = Array.from({length:1000}, (_,i) => ({get created_by(){reads++;return 'p'+i;}}));
  const fights = Array.from({length:5000}, () => ({status:'dead',opened_by_email:'p999'}));
  fights.push({status:'active',opened_by_email:'p999',started_at:'2026-10-21T00:00:00Z',current_hp:1});
  assert.equal(expireStaleBossFights(fights,Date.parse('2026-10-21T07:00:00Z'),players),1);
  assert.ok(reads <= 1002, `Expected one player scan, got ${reads} reads`);
});

test('reward confirmation rejects repeated clicks before a React rerender', async () => {
  const source = fs.readFileSync('src/components/game/RewardPopup.jsx','utf8');
  const start = source.indexOf('  const confirm = async () => {');
  const end = source.indexOf('  useEffect(',start);
  let finish;
  let calls = 0;
  const state=[];
  const context=vm.createContext({claimBusy:{current:false},setClaiming:value=>state.push(value),setClaimError(){},onConfirm:()=>{calls++;return new Promise(resolve=>{finish=resolve;});}});
  vm.runInContext(source.slice(start,end)+'\nglobalThis.confirm=confirm;',context);
  const first=context.confirm();
  await context.confirm(); await context.confirm();
  assert.equal(calls,1);
  assert.equal(context.claimBusy.current,true);
  finish();await first;
  assert.deepEqual(state,[true,false]);
});

test('event adopts a prefetched payload arriving after the first render', () => {
  const source=fs.readFileSync('src/components/game/HalloweenEventScene.jsx','utf8');
  const hook=source.split('\n').find(line=>line.includes('if (initialData) setData(initialData)'));
  assert.ok(hook);
  const payload={state:{balance:3}};
  let received;
  vm.runInNewContext(hook,{initialData:payload,useEffect:callback=>callback(),setData:data=>{received=data;}});
  assert.equal(received,payload);
});
