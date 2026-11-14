import { inventoryWithBattlePassAnimations } from '../../src/lib/battlePassAnimations.js';

export function validateEquipmentLoadout(player, requested) {
  if (!requested || typeof requested !== 'object' || Array.isArray(requested)) return false;
  const slots = new Set(['weapon', 'head', 'hands', 'armor', 'legs', 'boots', 'pet', 'accessory', 'animation']);
  const inventory = inventoryWithBattlePassAnimations(player);
  return Object.entries(requested).every(([slot, id]) => {
    if (!slots.has(slot)) return false;
    if (id === null || id === '') return true;
    if (typeof id !== 'string' || id.length > 160) return false;
    if (player.equipped_items?.[slot] === id) return true;
    return inventory.some(item => item?.id === id && item.type === 'equipment' && !item.locked && (!item.slot || item.slot === slot));
  });
}
