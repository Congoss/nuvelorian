import { getBalancedEquipmentItem } from './equipmentBalance.js';

export const BP_ANIMATION_ITEMS = [
  { id: 'bp_epic_animation', backgroundId: 'bp-epic', slot: 'animation', type: 'equipment', sourceType: 'battle_pass', rarity: 'epic', name: 'Raven Vortex', names: { ua: 'Воронячий вихор', ru: 'Вороний вихрь', en: 'Raven Vortex' }, bonuses: [], attack: 0, hp: 0, purchasable: false, locked: false, count: 1 },
  { id: 'bp_legendary_animation', backgroundId: 'bp-legendary', slot: 'animation', type: 'equipment', sourceType: 'battle_pass', rarity: 'legendary', name: 'Legendary Fire', names: { ua: 'Легендарне полум’я', ru: 'Легендарное пламя', en: 'Legendary Fire' }, bonuses: [], attack: 0, hp: 0, purchasable: false, locked: false, count: 1 },
].map(item => ({ ...item, bonuses: getBalancedEquipmentItem(item.id).bonuses }));

// Existing owners retain both parts of the previously combined reward.
export function inventoryWithBattlePassAnimations(profile) {
  const inventory = Array.isArray(profile?.inventory_items) ? profile.inventory_items : [];
  const unlocked = new Set(profile?.unlocked_backgrounds || []);
  const owned = new Set(inventory.map(item => item?.id));
  const missing = profile?.bp_background_rewards_separated ? [] : BP_ANIMATION_ITEMS.filter(item => unlocked.has(item.backgroundId) && !owned.has(item.id));
  return missing.length ? [...inventory, ...missing.map(item => ({ ...item }))] : inventory;
}
