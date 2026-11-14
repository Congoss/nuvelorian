import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { applyPlayerAction } from '../server/utils/playerActions.js';
import { openLootReward } from '../src/lib/lootOpening.js';
import { COLLECTION_REWARDS } from '../src/lib/questCollectionRewards.js';

function opening(apply) {
  const source = fs.readFileSync(new URL('../src/components/game/LootBoxModal.jsx', import.meta.url), 'utf8');
  const body = source.split('  const handleOpen = async () => {')[1].split('\n  return createPortal(')[0];
  const phases = [];
  const errors = [];
  const context = { openLootReward, openingRef: { current: false }, setErrorMessage: value => errors.push(value), setPhase: value => phases.push(value), setDrops() {}, onOpenBox: () => [{ type: 'weapon' }], onApplyDrops: apply, boxType: 'collection', bossId: null, fightId: null, instanceId: null, lang: 'ru', t: key => key, clearTimeout() {}, setTimeout: (callback, ms) => { if (ms === 900) callback(); return 1; } };
  const handle = vm.runInNewContext('(async () => {' + body.trim().replace(/;$/, '') + ')', context);
  return { handle, phases, errors, context };
}

test('chest waits for successful grant and blocks another opening while pending', async () => {
  let confirm;
  let calls = 0;
  const run = opening(() => { calls++; return new Promise(resolve => { confirm = resolve; }); });
  const pending = run.handle();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(run.phases, ['opening']);
  await run.handle();
  assert.equal(calls, 1);
  confirm();
  await pending;
  assert.deepEqual(run.phases, ['opening', 'result']);
});

test('failed grant keeps chest retryable without displaying rewards', async () => {
  const run = opening(async () => { throw Object.assign(new Error('Unavailable'), { code: 'COLLECTION_INCOMPLETE' }); });
  await run.handle();
  assert.deepEqual(run.phases, ['opening', 'preview']);
  assert.match(run.errors.at(-1), /COLLECTION_INCOMPLETE/);
  assert.equal(run.context.openingRef.current, false);
});

test('collection can be claimed for each full set and never without artifacts', () => {
  const player = { level: 3, collection_item_counts: Object.fromEntries(Array.from({ length: 7 }, (_, i) => ['p4-u00-artifact-' + (i + 1), 2])) };
  const action = { type: 'collection-claim', locationId: 'p4-u00' };
  applyPlayerAction(player, action);
  applyPlayerAction(player, action);
  assert.equal(player.collection_rewards_claimed['p4-u00'], 2);
  const reward = COLLECTION_REWARDS['p4-u00'];
  assert.equal(player.tentacles, reward.tentacles * 2);
  assert.equal(player.weapon_inventory['small-poison'], reward.weapon[1] * 2);
  assert.throws(() => applyPlayerAction(player, action), { code: 'COLLECTION_INCOMPLETE' });
  assert.equal(player.tentacles, reward.tentacles * 2);
});

 test('all repeatable location collections grant no paper and preserve existing balance',()=>{
for(let i=0;i<8;i++){const location='p4-u0'+i;const player={level:30,premium:17,collection_item_counts:Object.fromEntries(Array.from({length:7},(_,j)=>[location+'-artifact-'+(j+1),2]))};for(let repeat=0;repeat<2;repeat++){const result=applyPlayerAction(player,{type:'collection-claim',locationId:location});assert.equal(player.premium,17);assert.equal(result.reward.premium,undefined);}assert.equal(player.collection_rewards_claimed[location],2);assert.ok(player.tentacles>0);}
});
