export function applyAnubisLayerOverrides(map, equipped, itemMap) {
  const slots = Object.fromEntries(['head','armor','hands','legs','boots','weapon'].map(slot => [slot, itemMap.get(equipped[slot])?.setId === 'anubis']));
  if (!Object.values(slots).some(Boolean)) return;
  map.anubisSlots = slots;
  map.anubisEffects = true;
  if (slots.head) map.hideBaseHead = true;
  if (slots.boots) map.bootsOverLegs = equipped.legs !== 'cardboard_legs';
  if (slots.weapon) { map.rearWeapon = map.weapon; delete map.weapon; }
}
