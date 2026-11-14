import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';
import { TALENT_DEFS, getPoisonPreserveChance, buildEffectiveWeapon } from '../src/lib/talents.js';
import { resolveTalentAttack } from '../src/lib/talentCombat.js';

test('the old bonus boss skill is removed from the weapon list', () => {
  assert.equal(GAME_CONFIG.WEAPONS.some((weapon) => weapon.id === 'belly-strike'), false);
});

test('T50 is a passive damage bonus for every attack', () => {
  assert.equal(TALENT_DEFS.find((talent) => talent.id === 't50')?.name, 'Тиск без пауз');
  for (const weapon of [
    { id: 'fist', damage: 20 },
    { id: 'satchel', damage: 35 },
  ]) {
    const result = resolveTalentAttack({
      weapon,
      levels: { t50: 2 },
      state: {},
      fight: { current_hp: 1000, max_hp: 1000 },
      random: () => 1,
    });
    assert.equal(result.damage, weapon.damage + 10);
  }
});

test('poison-saving talents grant 1% per level and T09 does not affect Large Poison', () => {
  const levels = { t09: 10, t34: 10 };
  assert.equal(getPoisonPreserveChance(levels, 'satchel'), 0.2);
  assert.equal(getPoisonPreserveChance(levels, 'f4'), 0.2);
  assert.equal(getPoisonPreserveChance(levels, 'c4'), 0.1);
  assert.equal(buildEffectiveWeapon({ id: 'c4', damage: 10 }, { talent_tree_version: 2, talent_levels: levels }).saveChance, 0.1);
  assert.equal(resolveTalentAttack({ weapon: { id: 'satchel', damage: 10 }, levels, state: {}, fight: {}, random: () => 1 }).poisonPreserveChance, 0.2);
});
