import { duelStats } from './pvpDuel.js';
import { getEquipmentEnhancementLevels } from './equipmentEnhancementPresentation.js';

export function pvpEquipmentPreview(profile, item) {
  if (!item?.id || !item.slot || item.slot === 'background') return null;
  const levels = getEquipmentEnhancementLevels(profile);
  const inventory = (profile?.inventory_items || []).map(i => ({ ...i, enhancementLevel: levels[i.id] || 0 }));
  const current = duelStats({ ...profile, inventory_items: inventory });
  const selected = { ...item, enhancementLevel: levels[item.id] ?? item.enhancementLevel ?? 0 };
  const after = duelStats({ ...profile, inventory_items: [...inventory.filter(i => i.id !== item.id), selected], equipped_items: { ...profile?.equipped_items, [item.slot]: item.id } });
  const piece = after.pieces.find(piece => piece.slot === item.slot);
  return { slot: item.slot, attack: after.attack, hp: piece?.hp || 0, totalHp: after.maxHp, attackDelta: after.attack - current.attack, hpDelta: after.maxHp - current.maxHp, petBonusPct: Math.round(after.petBonus * 100) };
}
