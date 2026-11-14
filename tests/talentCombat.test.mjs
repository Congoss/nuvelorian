import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';
import { TALENT_DEFS, getPoisonPreserveChance, buildEffectiveWeapon } from '../src/lib/talents.js';
import { resolveTalentAttack, applyEquipmentBleed, getBleedTicks } from '../src/lib/talentCombat.js';

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

test('critical talent chances match their descriptions and double direct damage', () => {
  for (const [id, levels, fight, chance] of [
    ['fist', {t05:5,t14:3}, {current_hp:100,max_hp:100}, .08],
    ['knuckle', {t05:5,t28:4}, {current_hp:100,max_hp:100}, .09],
    ['c4', {t57:3}, {current_hp:49,max_hp:100}, .06],
  ]) {
    const args = {weapon:{id,damage:100},levels,state:{},fight};
    const crit = resolveTalentAttack({...args,random:() => chance - .00001});
    const normal = resolveTalentAttack({...args,random:() => chance + .00001});
    assert.ok(Math.abs(crit.critChance - chance) < 1e-10);
    assert.equal(crit.isCrit,true);
    assert.equal(normal.isCrit,false);
    assert.equal(crit.damage,normal.damage*2);
  }
});

test('equipment crit is added to talents for every attack, including poison', () => {
  for (const id of ['fist','knuckle','satchel','f4','c4']) {
    const args = {weapon:{id,damage:100,critChance:.05},levels:{t57:2},state:{},fight:{current_hp:49,max_hp:100}};
    assert.equal(resolveTalentAttack({...args,random:() => .089}).isCrit,true);
    assert.equal(resolveTalentAttack({...args,random:() => .091}).isCrit,false);
  }
});

test('no crit bonuses means no critical hit, and T57 requires less than half HP', () => {
  const args = {weapon:{id:'c4',damage:100},levels:{t57:10},state:{},random:() => 0};
  assert.equal(resolveTalentAttack({...args,fight:{current_hp:50,max_hp:100}}).isCrit,false);
  assert.equal(resolveTalentAttack({...args,fight:{current_hp:49,max_hp:100}}).isCrit,true);
});


test('equipment bleed preserves stronger damage, duration and unpaid ticks', () => {
  const state = { toxicMarks: 3, bleed: { damage: 245, lastTickAt: 1000, expiresAt: 60000 } };
  const next = applyEquipmentBleed(state, { damage: 25, durationMs: 30000, now: 4000 });
  assert.deepEqual(next, state);
  assert.equal(getBleedTicks(next, 4000).damage, 735);
  assert.notEqual(next, state);
});

test('equipment bleed extends active wounds and replaces expired wounds', () => {
  const state = { bleed: { damage: 245, lastTickAt: 1000, expiresAt: 6000 } };
  const next = applyEquipmentBleed(state, { damage: 25, durationMs: 30000, now: 4000 });
  assert.deepEqual(next.bleed, { damage: 245, lastTickAt: 1000, expiresAt: 34000 });
  const expired = applyEquipmentBleed(state, { damage: 25, durationMs: 30000, now: 7000 });
  assert.deepEqual(expired.bleed, { damage: 25, lastTickAt: 7000, expiresAt: 37000 });
  assert.equal(state.bleed.expiresAt, 6000);
});
