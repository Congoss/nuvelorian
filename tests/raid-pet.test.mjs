import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeaponTalentStats } from '../src/lib/talents.js';
import { calculateEquipmentEffects, getEquippedSetCounts } from '../src/lib/equipmentEffects.js';

const pet = { equipped_items: { pet: 'raidboss2_pet' } };
test('HERE Early pet applies agreed poison damage and critical chance only while equipped', () => {
  const owned = { inventory_items: [{ id: 'hereearlypet', type: 'equipment', slot: 'pet' }] };
  const equipped = { ...owned, equipped_items: { pet: 'hereearlypet' } };
  for (const [id, bonus] of [['satchel', 50], ['f4', 75], ['c4', 100], ['fist', 0]]) {
    const weapon = { id, damage: 100, cooldownMin: 0 };
    const base = getWeaponTalentStats(weapon, owned);
    const boosted = getWeaponTalentStats(weapon, equipped);
    assert.equal(boosted.damage - base.damage, bonus);
    assert.equal(boosted.critChance - base.critChance, .05);
    assert.equal(boosted.saveChance, base.saveChance);
  }
  assert.equal(calculateEquipmentEffects(owned).effects.critChancePct, 0);
});
test('raid pet grants poison damage and preservation even with only its persisted ID', () => {
  for (const [id, bonus] of [['satchel',30],['f4',40],['c4',50]]) {
    const weapon = { id, damage: 100, cooldownMin: 0 };
    const base = getWeaponTalentStats(weapon, {});
    const boosted = getWeaponTalentStats(weapon, pet);
    assert.equal(boosted.damage - base.damage, bonus);
    assert.equal(boosted.saveChance - base.saveChance, .02);
  }
  assert.equal(calculateEquipmentEffects(pet).effects.poisonPreserveChancePct, .02);
  assert.deepEqual(getEquippedSetCounts(pet), {});
});

test('pet does not change finger damage and unequipping removes its benefits', () => {
  const weapon = { id: 'fist', damage: 100, cooldownMin: 1 };
  assert.deepEqual(getWeaponTalentStats(weapon,pet), getWeaponTalentStats(weapon,{}));
  assert.equal(calculateEquipmentEffects({ equipped_items: { pet: null } }).effects.poisonPreserveChancePct, 0);
});
