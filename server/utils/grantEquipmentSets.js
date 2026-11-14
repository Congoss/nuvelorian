import { FEATURE_FLAGS } from '../../src/lib/featureFlags.js';
import { EQUIPMENT_SET_BALANCE, getBalancedEquipmentItem } from '../../src/lib/equipmentBalance.js';
import { EPIC_BP_ITEMS } from '../../src/lib/epicBattlePassSet.js';
import { LEGENDARY_BP_ITEMS } from '../../src/lib/legendaryBattlePassSet.js';

export function grantAllEquipmentSets(player) {
  const slots = ['weapon', 'head', 'armor', 'hands', 'legs', 'boots'];
  const catalog = [...EPIC_BP_ITEMS, ...LEGENDARY_BP_ITEMS];
  const inventory = [...(player.inventory_items || [])];
  const owned = new Set(inventory.map(item => item.id));
  let added = 0;
  for (const balance of Object.values(EQUIPMENT_SET_BALANCE)) {
    if (balance.prefix === 'halloween_2026' && !FEATURE_FLAGS.halloween) continue;
    for (const slot of slots) {
      const id = `${balance.prefix}_${slot}`;
      if (owned.has(id)) continue;
      inventory.push({ ...catalog.find(item => item.id === id), ...getBalancedEquipmentItem(id), type: 'equipment', count: 1, locked: false });
      owned.add(id);
      added++;
    }
  }
  player.inventory_items = inventory;
  player.unlocked_backgrounds = [...new Set(['garage', ...(player.unlocked_backgrounds || []), 'bp-epic', 'bp-legendary'])];
  return { added, total: inventory.length };
}

export function grantEquipmentSet(player, setId) {
  const balance = EQUIPMENT_SET_BALANCE[setId];
  if (!balance || (balance.prefix === 'halloween_2026' && !FEATURE_FLAGS.halloween)) return { added: 0, total: (player.inventory_items || []).length };
  const slots = ['weapon', 'head', 'armor', 'hands', 'legs', 'boots'];
  const inventory = [...(player.inventory_items || [])];
  const owned = new Set(inventory.map(item => item.id));
  let added = 0;
  for (const slot of slots) {
    const id = `${balance.prefix}_${slot}`;
    if (owned.has(id)) continue;
    inventory.push({ ...getBalancedEquipmentItem(id), id, slot, type: 'equipment', count: 1, locked: false });
    owned.add(id);
    added++;
  }
  player.inventory_items = inventory;
  return { added, total: inventory.length };
}
