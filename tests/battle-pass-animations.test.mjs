import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryWithBattlePassAnimations } from '../src/lib/battlePassAnimations.js';
import { calculateEquipmentEffects } from '../src/lib/equipmentEffects.js';
import { recordBattlePassEvent, claimBattlePassReward, battlePassView } from '../server/utils/battlePass.js';
import { BP_REWARDS } from '../src/lib/battlePass.js';

test('existing background owners receive separate effects without losing backgrounds or gear', () => {
  const gear = { id: 'bp_epic_head', type: 'equipment', slot: 'head' };
  const profile = { unlocked_backgrounds: ['garage', 'bp-epic', 'bp-legendary'], inventory_items: [gear] };
  const items = inventoryWithBattlePassAnimations(profile);
  assert.deepEqual(items.map(item => item.id), ['bp_epic_head', 'bp_epic_animation', 'bp_legendary_animation']);
  assert.equal(items[0], gear);
  assert.deepEqual(profile.unlocked_backgrounds, ['garage', 'bp-epic', 'bp-legendary']);
  assert.equal(inventoryWithBattlePassAnimations({ ...profile, inventory_items: items }), items);
});

test('locked effects are unavailable; equipping an owned effect changes no combat stats', () => {
  assert.deepEqual(inventoryWithBattlePassAnimations({ unlocked_backgrounds: ['garage'] }), []);
  const inventory_items = inventoryWithBattlePassAnimations({ unlocked_backgrounds: ['bp-epic'] });
  assert.equal(inventory_items.length, 1);
  assert.equal(inventory_items[0].slot, 'animation');
  const boosted = calculateEquipmentEffects({ inventory_items, equipped_items: { animation: 'bp_epic_animation' } });
  assert.equal(boosted.effects.energyRegenPct, .2);
  assert.deepEqual({ ...boosted.effects, energyRegenPct: 0 }, calculateEquipmentEffects({}).effects);
});

test('backgrounds unlock at level 40 independently of level 50 animations', () => {
  const now = Date.parse('2026-10-15T10:00:00Z');
  const player = { level: 1, inventory_items: [] };
  recordBattlePassEvent(player, { type: 'login' }, now);
  player.battle_pass.tier = 'legendary';
  player.battle_pass.xp = 6000;
  for (const track of ['epic', 'legendary']) {
    assert.equal(claimBattlePassReward(player, { track, level: 40 }, now), true);
    assert.ok(player.unlocked_backgrounds.includes(`bp-${track}`));
    assert.equal(player.inventory_items.filter(item => item.slot === 'animation').length, 0);
    assert.throws(() => claimBattlePassReward(player, { track, level: 50 }, now));
  }
  player.battle_pass.xp = 7500;
  for (const track of ['epic', 'legendary']) {
    assert.equal(claimBattlePassReward(player, { track, level: 50 }, now), true);
    assert.ok(player.unlocked_backgrounds.includes(`bp-${track}`));
    assert.equal(player.inventory_items.filter(item => item.id === `bp_${track}_animation`).length, 1);
    assert.equal(claimBattlePassReward(player, { track, level: 50 }, now), false);
  }
  battlePassView(player, now);
  assert.equal(player.inventory_items.filter(item => item.slot === 'animation').length, 2);
});

test('pets are scheduled at 46 and animation rewards remain at 50', () => {
  const pets = BP_REWARDS.find(row => row.level === 46);
  const animations = BP_REWARDS.find(row => row.level === 50);
  assert.ok(pets.epic.some(reward => reward.type === 'epic_pet'));
  assert.ok(pets.legendary.some(reward => reward.type === 'pet'));
  assert.ok(animations.epic.some(reward => reward.type === 'season_animation'));
  assert.ok(animations.legendary.some(reward => reward.type === 'exclusive_animation'));
  assert.ok(![...animations.epic, ...animations.legendary].some(reward => ['pet', 'epic_pet'].includes(reward.type)));
  const now = Date.parse('2026-10-15T10:00:00Z');
  const player = { level: 1, inventory_items: [] };
  recordBattlePassEvent(player, { type: 'login' }, now);
  player.battle_pass.tier = 'epic';
  player.battle_pass.xp = 46 * 150 - 1;
  assert.throws(() => claimBattlePassReward(player, { track: 'epic', level: 46 }, now));
  player.battle_pass.xp += 1;
  assert.equal(claimBattlePassReward(player, { track: 'epic', level: 46 }, now), true);
  assert.ok(player.inventory_items.some(item => item.id === 'bp_epic_pet'));
});
