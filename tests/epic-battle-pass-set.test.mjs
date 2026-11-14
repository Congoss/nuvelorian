import test from 'node:test';
import assert from 'node:assert/strict';
import { battlePassView, claimBattlePassReward, recordBattlePassEvent } from '../server/utils/battlePass.js';
import { EPIC_BP_ITEMS, EPIC_BP_REWARD_LEVELS } from '../src/lib/epicBattlePassSet.js';
process.env.BATTLE_PASS_START = '2026-09-14T00:00:00Z';
process.env.BATTLE_PASS_END = '2026-11-04T00:00:00Z';
const now = Date.parse('2026-10-08T12:00:00Z');
function player() {
  const p = { level: 1, inventory_items: [] };
  recordBattlePassEvent(p, { type: 'login' }, now);
  p.battle_pass.xp = 7500;
  p.battle_pass.tier = 'epic';
  return p;
}
test('epic gear and raven are real inventory items at the existing milestone levels', () => {
  const p = player();
  for (const level of Object.values(EPIC_BP_REWARD_LEVELS)) assert.equal(claimBattlePassReward(p, { level, track: 'epic' }, now), true);
  assert.equal(p.inventory_items.filter(item => item.slot !== 'animation').length, 7);
  assert.deepEqual(p.inventory_items.filter(item => item.slot !== 'animation').map(item => item.id).sort(), EPIC_BP_ITEMS.map(item => item.id).sort());
  assert.ok(p.inventory_items.filter(item => item.slot !== 'animation').every(item => item.type === 'equipment' && !item.locked));
  assert.equal(p.inventory_items.find(item => item.id === 'bp_epic_pet').slot, 'pet');
  for (const level of Object.values(EPIC_BP_REWARD_LEVELS)) assert.equal(claimBattlePassReward(p, { level, track: 'epic' }, now), false);
  assert.equal(p.inventory_items.filter(item => item.slot !== 'animation').length, 7);
});
test('claimed epic placeholders migrate once without repeating resource rewards or restoring sold items', () => {
  const p = player();
  p.weapon_inventory = { 'large-poison': 8 };
  p.battle_pass.claims = ['epic:5', 'epic:46'];
  p.battle_pass.items = [{ id: p.battle_pass.seasonId + ':epic:boots', type: 'boots', track: 'epic', placeholder: true }];
  battlePassView(p, now);
  assert.deepEqual(p.inventory_items.filter(item => item.slot !== 'animation').map(i => i.id), ['bp_epic_boots', 'bp_epic_pet']);
  assert.equal(p.weapon_inventory['large-poison'], 8);
  battlePassView(p, now);
  assert.equal(p.inventory_items.filter(item => item.slot !== 'animation').length, 2);
  p.inventory_items = p.inventory_items.filter(i => i.id !== 'bp_epic_boots');
  battlePassView(p, now);
  assert.equal(p.inventory_items.filter(item => item.slot !== 'animation').length, 1);
});
test('free and unreached epic rewards remain locked; legendary gear stays separate', () => {
  const p = player();p.battle_pass.tier = 'free';
  assert.throws(() => claimBattlePassReward(p, { level: 5, track: 'epic' }, now));
  p.battle_pass.tier = 'epic';p.battle_pass.xp = 0;
  assert.throws(() => claimBattlePassReward(p, { level: 5, track: 'epic' }, now));
  assert.equal(p.inventory_items.filter(item => item.slot !== 'animation').length, 0);
  p.battle_pass.tier = 'legendary';p.battle_pass.xp = 7500;
  claimBattlePassReward(p, { level: 5, track: 'legendary' }, now);
  assert.deepEqual(p.inventory_items.filter(item => item.slot !== 'animation').map(i=>i.id), ['bp_legendary_boots']);
  claimBattlePassReward(p, { level: 5, track: 'epic' }, now);
  assert.equal(p.inventory_items.filter(item => item.slot !== 'animation').length, 2);
});
