import { FRIDAY13_PET } from './friday13Promo.js';
import { HALLOWEEN_EQUIPMENT } from './halloweenEquipment.js';
import { SKELETON_BP_EQUIPMENT, SKELETON_BP_SET_ID, SKELETON_BP_SET_BONUSES } from './skeletonBattlePassSet.js';
// Shared by the server combat calculation and equipment UI.
export const EQUIPMENT_SET_BALANCE = {
  [SKELETON_BP_SET_ID]: { prefix: SKELETON_BP_SET_ID, two: SKELETON_BP_SET_BONUSES[0].value, four: SKELETON_BP_SET_BONUSES[1].value, six: SKELETON_BP_SET_BONUSES[2].value },
  halloween_2026: {prefix:'halloween_2026',two:20,four:35,six:55},
  bp_legendary: { prefix: 'bp_legendary', hit: 40, pencilHit: 30, poison: 55, boss: 25, fingerCd: 25, pencilCd: 45, two: 30, four: 50, six: 75 },
  bp_epic: { prefix: 'bp_epic', hit: 25, pencilHit: 20, poison: 35, boss: 15, fingerCd: 20, pencilCd: 30, two: 20, four: 35, six: 50 },
  cardboard_survivor: { prefix: 'cardboard', hit: 10, poison: 15, boss: 5, fingerCd: 10, pencilCd: 15, two: 10, four: 15, six: 20 },
  night_disinfector: { prefix: 'night_disinfector', hit: 25, poison: 35, boss: 15, fingerCd: 20, pencilCd: 30, two: 25, four: 35, six: 50 },
  nuvelor: { prefix: 'nuvelor', hit: 50, poison: 70, boss: 30, fingerCd: 30, pencilCd: 60, two: 50, four: 70, six: 100 },
  set4: { prefix: 'set4', hit: 90, poison: 120, boss: 55, fingerCd: 45, pencilCd: 90, two: 90, four: 120, six: 180 },
  set5: { prefix: 'set5', hit: 150, poison: 200, boss: 90, fingerCd: 60, pencilCd: 120, two: 150, four: 200, six: 300 },
  anubis: { prefix: 'anubis', hit: 225, poison: 300, boss: 135, fingerCd: 75, pencilCd: 150, two: 225, four: 300, six: 450 },
  shkraban: { prefix: 'shkraban', hit: 270, poison: 360, boss: 165, fingerCd: 90, pencilCd: 180, two: 270, four: 360, six: 540 },
  newbie_pack_ii_gear: { prefix: 'newbie_pack_ii', hit: 10, poison: 15, boss: 5, fingerCd: 10, pencilCd: 15, two: 10, four: 15, six: 20 },
};
export function getBalancedEquipmentItem(id) {
  if(id===FRIDAY13_PET.id)return {...FRIDAY13_PET};
  const skeletonItem = Object.values(SKELETON_BP_EQUIPMENT).find(item => item.id === id);
  if (skeletonItem) return skeletonItem;
  const halloween = HALLOWEEN_EQUIPMENT.find(item => item.id === id);
  if (halloween) return halloween;
  if (id === 'bp_epic_pet') return { id, slot: 'pet', bonuses: [
    { type: 'small_poison_flat', value: 30 },
    { type: 'medium_poison_flat', value: 45 },
    { type: 'large_poison_flat', value: 60 },
    { type: 'poison_preserve_chance_pct', value: .03 },
  ] };
  if (id === 'bp_legendary_pet') return { id, slot: 'pet', bonuses: [
    { type: 'small_poison_flat', value: 50 },
    { type: 'medium_poison_flat', value: 75 },
    { type: 'large_poison_flat', value: 100 },
    { type: 'poison_preserve_chance_pct', value: .05 },
  ] };
  // Persisted pet drops contain only id/slot; resolve their existing bonuses on both sides.
  if (id === 'pet-bot') return { id, slot: 'pet', bonuses: [
    { type: 'small_poison_flat', value: 10 },
    { type: 'medium_poison_flat', value: 20 },
    { type: 'large_poison_flat', value: 30 },
    { type: 'energy_capacity_flat', value: 25 },
  ] };
  if (id === 'pet-skunk') return { id, slot: 'pet', bonuses: [
    { type: 'small_poison_flat', value: 25 },
    { type: 'medium_poison_flat', value: 40 },
    { type: 'large_poison_flat', value: 60 },
    { type: 'poison_preserve_chance_pct', value: .03 },
  ] };
  if (id === 'pet-cthulhu') return { id, slot: 'pet', bonuses: [
    { type: 'small_poison_flat', value: 20 },
    { type: 'medium_poison_flat', value: 35 },
    { type: 'large_poison_flat', value: 50 },
    { type: 'crit_chance_pct', value: .01 },
  ] };
  if (id === 'legion_pet') return { id, slot: 'pet', bonuses: [
    { type: 'bleed_chance_pct', value: .05 },
    { type: 'small_poison_flat', value: 10 },
    { type: 'medium_poison_flat', value: 20 },
    { type: 'large_poison_flat', value: 30 },
  ] };
  if (id === 'pet-toaster') return { id, slot: 'pet', bonuses: [
    { type: 'small_poison_flat', value: 120 },
    { type: 'medium_poison_flat', value: 180 },
    { type: 'large_poison_flat', value: 240 },
    { type: 'poison_crit_chance_pct', value: .10 },
  ] };
  if (id === 'pet-purrgulp') return { id, slot: 'pet', bonuses: [
    { type: 'small_poison_flat', value: 100 },
    { type: 'medium_poison_flat', value: 150 },
    { type: 'large_poison_flat', value: 200 },
    { type: 'poison_preserve_chance_pct', value: .05 },
  ] };
  if (id === 'hereearlypet') return { id, slot: 'pet', bonuses: [
    { type: 'small_poison_flat', value: 50 },
    { type: 'medium_poison_flat', value: 75 },
    { type: 'large_poison_flat', value: 100 },
    { type: 'crit_chance_pct', value: .05 },
  ] };
  const crownPreserve = { raidboss2_crown_accessory: .05, raidboss2_crown2_accessory: .03, raidboss2_crown3_accessory: .02 }[id];
  if (crownPreserve) return { id, slot: 'accessory', bonuses: [{ type: 'poison_preserve_chance_pct', value: crownPreserve }] };
  if (id === 'bp_epic_animation' || id === 'bp_legendary_animation') return { id, slot: 'animation', bonuses: [{ type: 'energy_regen_pct', value: id === 'bp_epic_animation' ? .2 : .3 }] };
  if (id === 'raidboss2_pet') return { id, slot: 'pet', bonuses: [
    { type: 'small_poison_flat', value: 30 },
    { type: 'medium_poison_flat', value: 40 },
    { type: 'large_poison_flat', value: 50 },
    { type: 'poison_preserve_chance_pct', value: .02 },
  ] };
  if (id === 'pet5') return { id, slot: 'pet', bonuses: [
    { type: 'small_poison_flat', value: 40 },
    { type: 'medium_poison_flat', value: 60 },
    { type: 'large_poison_flat', value: 80 },
    { type: 'energy_capacity_flat', value: 20 },
  ] };
  for (const [setId, balance] of Object.entries(EQUIPMENT_SET_BALANCE)) {
    const slot = String(id || '').slice(balance.prefix.length + 1);
    if (id !== balance.prefix + '_' + slot) continue;
    const cardboardLayout = ['cardboard_survivor', 'newbie_pack_ii_gear', 'bp_epic', 'bp_legendary'].includes(setId);
    const bySlot = {
      head: ['boss_damage_flat', balance.boss],
      boots: ['pencil_cooldown_sec', -balance.pencilCd],
      weapon: [cardboardLayout ? 'pencil_damage_flat' : 'finger_damage_flat', balance.pencilHit ?? balance.hit],
      armor: [cardboardLayout ? 'finger_damage_flat' : 'pencil_damage_flat', balance.hit],
      hands: [cardboardLayout ? 'poison_damage_flat' : 'finger_cooldown_sec', cardboardLayout ? balance.poison : -balance.fingerCd],
      legs: [cardboardLayout ? 'finger_cooldown_sec' : 'poison_damage_flat', cardboardLayout ? -balance.fingerCd : balance.poison],
    };
    if (!bySlot[slot]) continue;
    const [type, value] = bySlot[slot];
    return { id, slot, setId, bonuses: [{ type, value }] };
  }
  return null;
}
