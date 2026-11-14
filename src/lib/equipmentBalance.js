// Shared by the server combat calculation and equipment UI.
export const EQUIPMENT_SET_BALANCE = {
  bp_legendary: { prefix: 'bp_legendary', hit: 40, pencilHit: 30, poison: 55, boss: 25, fingerCd: 25, pencilCd: 45, two: 30, four: 50, six: 75 },
  bp_epic: { prefix: 'bp_epic', hit: 25, pencilHit: 20, poison: 35, boss: 15, fingerCd: 20, pencilCd: 30, two: 20, four: 35, six: 50 },
  cardboard_survivor: { prefix: 'cardboard', hit: 10, poison: 15, boss: 5, fingerCd: 10, pencilCd: 15, two: 10, four: 15, six: 20 },
  night_disinfector: { prefix: 'night_disinfector', hit: 25, poison: 35, boss: 15, fingerCd: 20, pencilCd: 30, two: 25, four: 35, six: 50 },
  nuvelor: { prefix: 'nuvelor', hit: 50, poison: 70, boss: 30, fingerCd: 30, pencilCd: 60, two: 50, four: 70, six: 100 },
  set4: { prefix: 'set4', hit: 90, poison: 120, boss: 55, fingerCd: 45, pencilCd: 90, two: 90, four: 120, six: 180 },
  set5: { prefix: 'set5', hit: 150, poison: 200, boss: 90, fingerCd: 60, pencilCd: 120, two: 150, four: 200, six: 300 },
  newbie_pack_ii_gear: { prefix: 'newbie_pack_ii', hit: 10, poison: 15, boss: 5, fingerCd: 10, pencilCd: 15, two: 10, four: 15, six: 20 },
};
export function getBalancedEquipmentItem(id) {
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
