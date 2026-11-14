import { EQUIPMENT_SET_BALANCE, getBalancedEquipmentItem } from './equipmentBalance.js';
export const CARDBOARD_SURVIVOR_SET_ID = 'cardboard_survivor';
export const NIGHT_DISINFECTOR_SET_ID = 'night_disinfector';
export const NUVELOR_SET_ID = 'nuvelor';
export const SET5_SET_ID = 'set5';
const BONUS_KEY_BY_TYPE = {
  finger_damage_flat: 'fingerDamageFlat',
  pencil_damage_flat: 'pencilDamageFlat',
  poison_damage_flat: 'poisonDamageFlat',
  boss_damage_flat: 'bossDamageFlat',
  small_poison_flat: 'smallPoisonFlat',
  medium_poison_flat: 'mediumPoisonFlat',
  large_poison_flat: 'largePoisonFlat',
  energy_capacity_flat: 'energyCapacityFlat',
  energy_regen_pct: 'energyRegenPct',
  crit_chance_pct: 'critChancePct',
  poison_preserve_chance_pct: 'poisonPreserveChancePct',
  finger_damage_pct: 'fingerDamagePct',
  pencil_damage_pct: 'pencilDamagePct',
  boss_damage_pct: 'bossDamagePct',
  poison_damage_pct: 'poisonDamagePct',
  finger_cooldown_sec: 'fingerCooldownSec',
  pencil_cooldown_sec: 'pencilCooldownSec',
};

// Boss drops persist only their id and slot. Keep their gameplay metadata here
// so effects work identically for old and newly dropped pieces.


export function getEquipmentItemById(id, profile = null) {
  if (!id) return null;
  const items = Array.isArray(profile?.inventory_items) ? profile.inventory_items : [];
  const item = items.find((entry) => String(entry?.id || '') === String(id));
  const fallback = getBalancedEquipmentItem(id);
  if (!item) return fallback ? { id, ...fallback } : null;
  return fallback ? { ...item, ...fallback } : item;
}

function getEquippedItems(profile) {
  const equippedIds = Object.values(profile?.equipped_items || {}).filter(Boolean);
  return equippedIds.map((itemId) => getEquipmentItemById(itemId, profile)).filter(Boolean);
}

export function getEquippedSetCounts(profile) {
  const counts = {};
  getEquippedItems(profile).forEach((item) => {
    if (!item?.setId || item.slot === 'pet') return;
    counts[item.setId] = (counts[item.setId] || 0) + 1;
  });
  return counts;
}

export function calculateEquipmentEffects(profile) {
  const effects = {
    fingerDamageFlat: 0, pencilDamageFlat: 0, poisonDamageFlat: 0, bossDamageFlat: 0,
    smallPoisonFlat: 0, mediumPoisonFlat: 0, largePoisonFlat: 0, critChancePct: 0,
    energyCapacityFlat: 0,
    energyRegenPct: 0,
    poisonPreserveChancePct: 0,
    fingerDamagePct: 0,
    pencilDamagePct: 0,
    fingerCooldownSec: 0,
    pencilCooldownSec: 0,
    poisonDamagePct: 0,
    bossDamagePct: 0,
  };

  getEquippedItems(profile).forEach((item) => {
    (item?.bonuses || []).forEach((bonus) => {
      const key = BONUS_KEY_BY_TYPE[bonus?.type];
      if (!key) return;
      effects[key] += Number(bonus?.value || 0);
    });
  });

  const setCounts = getEquippedSetCounts(profile);
  const setBonusesBySet = {};
  for (const [setId, balance] of Object.entries(EQUIPMENT_SET_BALANCE)) {
    const count = Number(setCounts[setId] || 0);
    if (count >= 2) effects.fingerDamageFlat += balance.two;
    if (count >= 4) effects.pencilDamageFlat += balance.four;
    if (count >= 6) effects.bossDamageFlat += balance.six;
    setBonusesBySet[setId] = [
      { pieces: 2, active: count >= 2, text: 'Finger damage +' + balance.two },
      { pieces: 4, active: count >= 4, text: 'Pencil damage +' + balance.four },
      { pieces: 6, active: count >= 6, text: 'Boss damage +' + balance.six },
    ];
  }
  return { effects, setCounts, setBonusesBySet };
}

export function applyEquipmentEffectsToWeapon(baseWeapon, profile) {
  const { effects } = calculateEquipmentEffects(profile);
  const result = { ...baseWeapon };
  const id = String(result?.id || '');

  const isFinger = id === 'fist' || id === 'finger';
  const isPencil = id === 'knuckle' || id === 'pencil';
  const isPoison = [
    'satchel',
    'small-poison',
    'smallPoison',
    'f4',
    'medium-poison',
    'mediumPoison',
    'c4',
    'large-poison',
    'bigPoison',
  ].includes(id);

  let damageMultiplier = 1;
  if (isFinger) damageMultiplier += effects.fingerDamagePct;
  if (isPencil) damageMultiplier += effects.pencilDamagePct;
  if (isPoison) damageMultiplier += effects.poisonDamagePct;

  const flatDamage = effects.bossDamageFlat
    + (isFinger ? effects.fingerDamageFlat : 0)
    + (isPencil ? effects.pencilDamageFlat : 0)
    + (isPoison ? effects.poisonDamageFlat : 0)
    + (['satchel', 'small-poison', 'smallPoison'].includes(id) ? effects.smallPoisonFlat : 0)
    + (['f4', 'medium-poison', 'mediumPoison'].includes(id) ? effects.mediumPoisonFlat : 0)
    + (['c4', 'large-poison', 'bigPoison'].includes(id) ? effects.largePoisonFlat : 0);
  result.damage = Math.max(1, Math.floor((result.damage || 0) * damageMultiplier + flatDamage));

  const cooldownSecDelta = (isFinger ? effects.fingerCooldownSec : 0) + (isPencil ? effects.pencilCooldownSec : 0);
  if (cooldownSecDelta !== 0) {
    result.cooldownMin = Math.max(0, (result.cooldownMin || 0) + cooldownSecDelta / 60);
  }

  if (isFinger || isPencil) result.cooldownMin = Math.max(isFinger ? 5 / 60 : 30 / 60, Number(result.cooldownMin || 0));
  result.critChance = Number(result.critChance || 0) + effects.critChancePct;
  result.equipmentBossDamagePct = effects.bossDamagePct;
  if (isPoison) result.saveChance = Math.min(1, Math.max(0, Number(result.saveChance || 0) + effects.poisonPreserveChancePct));
  return result;
}
