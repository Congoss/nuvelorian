// New season draft. Separate IDs preserve equipment from earlier seasons.
export const SKELETON_BP_SET_ID = 'bp_skeleton_2026';
export const SKELETON_BP_EQUIPMENT = Object.fromEntries(Object.entries({
  weapon: ['finger_damage_flat', 180],
  armor: ['pencil_damage_flat', 180],
  head: ['boss_damage_flat', 100],
  hands: ['finger_cooldown_sec', -60],
  legs: ['poison_damage_flat', 240],
  boots: ['pencil_cooldown_sec', -120],
}).map(([slot, [type, value]]) => [slot, {
  id: `${SKELETON_BP_SET_ID}_${slot}`, slot, setId: SKELETON_BP_SET_ID,
  rarity: 'legendary', bonuses: [{ type, value }],
}]));
export const SKELETON_BP_SET_BONUSES = [
  { pieces: 2, type: 'finger_damage_flat', value: 180 },
  { pieces: 4, type: 'pencil_damage_flat', value: 240 },
  { pieces: 6, type: 'boss_damage_flat', value: 350 },
];
export const SKELETON_BP_CURSE = {
  id: 'bone_curse', requiredPieces: 6, trigger: 'poison_hit', chance: 0.05,
  durationSeconds: 60, poisonDamageBonusPct: 0.10, cooldownSeconds: 3600,
  cooldownStarts: 'effect_end', refreshable: false, stackable: false,
  persistsAcrossBosses: true, persistsAcrossEquipmentChanges: true,
};

export function resolveBoneCurse(player, poisonDamage, now = Date.now(), random = Math.random) {
  if (!(poisonDamage > 0)) return { damage: poisonDamage, applied: false };
  const rule = SKELETON_BP_CURSE;
  let curse = player.bone_curse;
  const equipped = Object.values(SKELETON_BP_EQUIPMENT).every(item => player.equipped_items?.[item.slot] === item.id);
  const applied = equipped && !(Number(curse?.cooldownUntil) > now) && random() < rule.chance;
  if (applied) {
    const expiresAt = now + rule.durationSeconds * 1000;
    curse = player.bone_curse = { expiresAt, cooldownUntil: expiresAt + rule.cooldownSeconds * 1000 };
  }
  return { damage: Number(curse?.expiresAt) > now ? Math.floor(poisonDamage * (1 + rule.poisonDamageBonusPct)) : poisonDamage, applied };
}
