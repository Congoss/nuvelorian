import test from 'node:test';
import assert from 'node:assert/strict';
import { bossDefeatNotice } from '../src/lib/bossDefeatNotice.js';
test('boss chest notices include finisher in all languages and do not label other chests as boss rewards', () => {
  const box = { rewardFormula: 'boss_v2', lastHitPlayerName: 'Finisher' };
  for (const lang of ['uk','ru','en']) assert.ok(bossDefeatNotice(box,lang).includes('Finisher'));
  assert.equal(bossDefeatNotice({},'uk'), '');
  assert.equal(bossDefeatNotice({rewardFormula:'boss_v2'},'uk'), 'Бос переможений!');
});
