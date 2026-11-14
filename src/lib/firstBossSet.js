export const FIRST_BOSS_SET_IDS = ['cardboard_weapon','cardboard_head','cardboard_armor','cardboard_hands','cardboard_legs','cardboard_boots'];

// Reserve unopened rewards too: banking chests must never produce duplicate parts.
export function firstBossSetReward(player, {bossId, firstBossId, fightId, kills, drops, random = Math.random}) {
  if (bossId !== firstBossId) return drops;
  const owned = new Set([
    ...(player.inventory_items || []).map(item => item.id),
    ...Object.values(player.equipped_items || {}),
    ...(player.pending_boss_boxes || []).flatMap(box => [...(box.rewardSnapshot || []), ...(box.bonusDrops || [])].map(drop => drop.itemId)),
  ]);
  const missing = FIRST_BOSS_SET_IDS.filter(id => !owned.has(id));
  if (!missing.length) return drops;
  const previous = player.first_boss_set_progress || {};
  if (previous.lastFightId === fightId) return drops;
  const misses = Math.max(0, Number(previous.misses) || 0) + 1;
  const first = kills === 1;
  const rolledGear = drops.some(drop => drop.type === 'boss_gear_piece');
  if (!first && !rolledGear && misses < 8) {
    player.first_boss_set_progress = {misses, lastFightId: fightId};
    return drops;
  }
  const visible = missing.filter(id => ['cardboard_head','cardboard_armor'].includes(id));
  const pool = first && visible.length ? visible : missing;
  const itemId = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  const equipment = {type:'equipment',itemId,bossId,qty:1,quality:'boss_gear_piece',isNew:true,...(first ? {starterEquipment:true} : {})};
  player.first_boss_set_progress = {misses:0, lastFightId:fightId};
  return [...drops.filter(drop => drop.type !== 'boss_gear_piece'), equipment];
}
