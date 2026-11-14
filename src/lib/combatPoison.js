const poisonSlots = Object.freeze({ satchel: 'small-poison', f4: 'medium-poison', c4: 'large-poison' });

export function getCombatPoisonSlot(weaponId) {
  return Object.hasOwn(poisonSlots, weaponId) ? poisonSlots[weaponId] : undefined;
}

export function countConsumedPoison(count, saveChance, random = Math.random) {
  let consumed = 0;
  for (let dose = 0; dose < count; dose++) {
    if (random() >= Number(saveChance || 0)) consumed++;
  }
  return consumed;
}
