import test from 'node:test';
import assert from 'node:assert/strict';
import { EQUIPMENT_SET_BALANCE, getBalancedEquipmentItem } from '../src/lib/equipmentBalance.js';
import { calculateEquipmentEffects, applyEquipmentEffectsToWeapon, getEquipmentItemById } from '../src/lib/equipmentEffects.js';
import { getWeaponTalentStats } from '../src/lib/talents.js';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';
const slots = ['weapon', 'head', 'hands', 'armor', 'legs', 'boots'];
function loadout(setId, count = 6) {
  const prefix = EQUIPMENT_SET_BALANCE[setId].prefix;
  return { equipped_items: Object.fromEntries(slots.slice(0, count).map(slot => [slot, prefix + '_' + slot])) };
}
const tiers = [
  ['bp_legendary', 170, 180, 155, 25, 45],
  ['bp_epic', 110, 120, 100, 20, 30],
  ['cardboard_survivor', 45, 50, 40, 10, 15],
  ['night_disinfector', 115, 125, 100, 20, 30],
  ['nuvelor', 230, 250, 200, 30, 60],
  ['set4', 415, 445, 355, 45, 90],
  ['set5', 690, 740, 590, 60, 120],
];
for (const [id, finger, pencil, poison, fingerCd, pencilCd] of tiers) {
  test(id + ' adds the agreed flat damage and cooldown bonuses to combat', () => {
    const profile = loadout(id);
    for (const [weaponId, bonus, reduction] of [['fist', finger, fingerCd], ['knuckle', pencil, pencilCd], ['satchel', poison, 0], ['f4', poison, 0], ['c4', poison, 0]]) {
      const base = GAME_CONFIG.WEAPONS.find(w => w.id === weaponId);
      const result = getWeaponTalentStats(base, profile);
      assert.equal(result.damage, base.damage + bonus);
      assert.ok(Math.abs(result.cooldownMin - (base.cooldownMin - reduction / 60)) < 1e-10);
      assert.equal(result.equipmentBossDamagePct, 0);
    }
  });
}
test('existing persisted percent bonuses are replaced, without mutating inventory', () => {
  const profile = { ...loadout('set5', 1), inventory_items: [{ id: 'set5_weapon', slot: 'weapon', setId: 'set5', bonuses: [{ type: 'finger_damage_pct', value: .08 }] }] };
  assert.deepEqual(getEquipmentItemById('set5_weapon', profile).bonuses, [{ type: 'finger_damage_flat', value: 150 }]);
  assert.equal(applyEquipmentEffectsToWeapon({ id: 'fist', damage: 20, cooldownMin: 10 }, profile).damage, 170);
  assert.equal(profile.inventory_items[0].bonuses[0].type, 'finger_damage_pct');
});
test('set thresholds accumulate at two, four and six pieces, and mixed sets stay separate', () => {
  for (const count of [1, 2, 3, 4, 5, 6]) {
    const result = calculateEquipmentEffects(loadout('set5', count));
    assert.deepEqual(result.setBonusesBySet.set5.map(b => b.active), [count >= 2, count >= 4, count >= 6]);
  }
  const mixed = { equipped_items: { weapon: 'cardboard_weapon', armor: 'set5_armor' } };
  assert.deepEqual(calculateEquipmentEffects(mixed).setCounts, { cardboard_survivor: 1, set5: 1 });
  assert.equal(applyEquipmentEffectsToWeapon({ id: 'fist', damage: 20 }, mixed).damage, 20);
});
test('cooldown floors apply after talents and equipment; poisons retain zero cooldown', () => {
  const profile = { ...loadout('set5'), talent_levels: { t06: 10, t11: 10 } };
  assert.equal(getWeaponTalentStats({ id: 'fist', damage: 20, cooldownMin: 1 }, profile).cooldownMin, 5 / 60);
  assert.equal(getWeaponTalentStats({ id: 'knuckle', damage: 50, cooldownMin: 1 }, profile).cooldownMin, .5);
  assert.equal(getWeaponTalentStats({ id: 'satchel', damage: 35, cooldownMin: 0 }, profile).cooldownMin, 0);
});
test('newbie II matches the first set, and unknown gear retains its own bonuses', () => {
  for (const id of ['fist', 'knuckle', 'satchel']) {
    assert.equal(applyEquipmentEffectsToWeapon({ id, damage: 50 }, loadout('newbie_pack_ii_gear')).damage, applyEquipmentEffectsToWeapon({ id, damage: 50 }, loadout('cardboard_survivor')).damage);
  }
  assert.equal(getBalancedEquipmentItem('set5_not-an-item'), null);
  assert.equal(applyEquipmentEffectsToWeapon({ id: 'fist', damage: 100 }, { equipped_items: { pet: 'custom-pet' }, inventory_items: [{ id: 'custom-pet', slot: 'pet', bonuses: [{ type: 'finger_damage_pct', value: .1 }] }] }).damage, 110);
});

test('Epic BP grants each agreed slot bonus and keeps the raven cosmetic', async () => {
  const { EPIC_BP_ITEMS } = await import('../src/lib/epicBattlePassSet.js');
  const expected = { armor: ['finger_damage_flat',25], weapon: ['pencil_damage_flat',20], hands: ['poison_damage_flat',35], head: ['boss_damage_flat',15], legs: ['finger_cooldown_sec',-20], boots: ['pencil_cooldown_sec',-30] };
  for (const [slot,[type,value]] of Object.entries(expected)) {
    const item = EPIC_BP_ITEMS.find(item => item.slot === slot);
    assert.deepEqual(item.bonuses,[{type,value}]);
    const profile = {equipped_items:{[slot]:item.id},inventory_items:[{...item,bonuses:[]}]};
    assert.deepEqual(getEquipmentItemById(item.id,profile).bonuses,[{type,value}]);
  }
  const pet = EPIC_BP_ITEMS.find(item => item.slot === 'pet');
  assert.deepEqual(pet.bonuses,[]);
  assert.equal(pet.setId,null);
  const effects = calculateEquipmentEffects({...loadout('bp_epic'),equipped_items:{...loadout('bp_epic').equipped_items,pet:pet.id},inventory_items:[pet]});
  assert.equal(effects.setCounts.bp_epic,6);
});
