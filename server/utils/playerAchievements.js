import { ACHIEVEMENT_REWARDS } from '../../src/lib/playerAchievements.js';
import { HALLOWEEN, halloweenState } from '../../src/lib/halloweenEvent.js';
import { getBalancedEquipmentItem } from '../../src/lib/equipmentBalance.js';

export function reconcilePlayerAchievements(player, now = Date.now()) {
  reconcileHalloweenAchievement(player, now);
  if (Number(player.likes_received_count || 0) >= 500) unlockAchievement(player, 'positive_karma_500', null, now);
  if (Number(player.dislikes_received_count || 0) >= 100) unlockAchievement(player, 'negative_karma_100', null, now);
  const sets = new Map();
  for (const item of player.inventory_items || []) {
    if (Number(item.count ?? 1) <= 0) continue;
    const definition = getBalancedEquipmentItem(item.id);
    if (!definition?.setId || !['weapon', 'head', 'hands', 'armor', 'legs', 'boots'].includes(definition.slot)) continue;
    if (!sets.has(definition.setId)) sets.set(definition.setId, new Map());
    const slots = sets.get(definition.setId);
    slots.set(definition.slot, Math.max(slots.get(definition.slot) ?? 0, Number(item.enhancementLevel || 0)));
  }
  for (const slots of sets.values()) {
    if (slots.size !== 6) continue;
    unlockAchievement(player, 'first_full_set', null, now);
    if ([...slots.values()].every(level => level >= 15)) unlockAchievement(player, 'full_set_plus_15', null, now);
  }
}

export function recordFishingAchievement(player, caught, now = Date.now(), rarity = null) {
  const misses = caught ? 0 : Math.min(3, Number(player.achievement_progress?.fishingMisses || 0) + 1);
  player.achievement_progress = { ...player.achievement_progress, fishingMisses: misses };
  if (misses >= 3) unlockAchievement(player, 'three_empty_casts', null, now);
  const trash = caught && rarity === 'trash' ? Math.min(5, Number(player.achievement_progress?.fishingTrash || 0) + 1) : 0;
  player.achievement_progress = { ...player.achievement_progress, fishingTrash: trash };
  if (trash >= 5) unlockAchievement(player, 'fishing_trash_5', null, now);
}

export function recordGumAchievement(player, success, now = Date.now()) {
  const misses = success ? 0 : Math.min(10, Number(player.achievement_progress?.gumMisses || 0) + 1);
  player.achievement_progress = { ...player.achievement_progress, gumMisses: misses };
  if (misses >= 10) unlockAchievement(player, 'gum_no_upgrade_10', null, now);
  reconcilePlayerAchievements(player, now);
}

// Only orders created by the new server carry this persisted, server-owned marker.
export function recordDonationAchievement(player, transaction, now = Date.now()) {
  if (transaction?.status !== 'success' || transaction.exchange_rate_snapshot?.achievementDonationV1 !== true) return false;
  if (!Number.isFinite(Number(transaction.usd_price)) || Number(transaction.usd_price) < 5) return false;
  return unlockAchievement(player, 'generous_soul', { id: transaction.id }, now);
}

export function recordBossTimeoutAchievement(fight, players = [], now = Date.now()) {
  if (fight.status !== 'expired' || !(fight.current_hp > 0) || !(fight.max_hp > 0) || fight.current_hp / fight.max_hp >= .2) return;
  const owner = String(fight.opened_by_email || '').toLowerCase();
  for (const player of players) {
    const participant = fight.participants?.[String(player.id)];
    if ((owner && String(player.created_by || '').toLowerCase() === owner) || Number(participant?.damage || 0) > 0 || fight.achievement_combat?.contributors?.[String(player.id)]) {
      unlockAchievement(player, 'almost_finished', fight, now);
    }
  }
}
export function reconcileHalloweenAchievement(player, now = Date.now()) {
  if (player?.halloween_event?.id !== HALLOWEEN.id) return false;
  if (halloweenState(player, now).activityTotal < 500) return false;
  return unlockAchievement(player, 'halloween_hunter_500', { id: HALLOWEEN.id }, now);
}
const POISONS = ['small-poison', 'medium-poison', 'large-poison'];
export function poisonCount(player) {
  return POISONS.reduce((sum, id) => sum + Math.max(0, Number(player.weapon_inventory?.[id] || 0)), 0);
}
export function unlockAchievement(player, id, fight, now = Date.now()) {
  if (!player || player.player_achievements?.[id] || !ACHIEVEMENT_REWARDS[id]) return false;
  const rewards = { ...ACHIEVEMENT_REWARDS[id] };
  player.player_achievements = { ...player.player_achievements, [id]: { unlocked_at: new Date(now).toISOString(), ...(fight?.id ? { fight_id: fight.id } : {}), rewards, reward_status: 'pending' } };
  return true;
}
// Must receive every applied damage event, including passive ticks and assists.
export function recordAchievementDamage({ fight, player, players = [], hpBefore, damage, weaponId, bleed = false, lastPoisonSaved = false, now = Date.now() }) {
  if (!player || !(damage > 0) || !(hpBefore > 0)) return;
  const hpAfter = Number(fight.current_hp);
  const previous = fight.achievement_combat;
  const state = previous || { complete: hpBefore === Number(fight.max_hp), contributors: {} };
  const id = String(player.id);
  const prior = state.contributors[id];
  fight.achievement_combat = { ...state, contributors: { ...state.contributors, [id]: { fingerOnly: bleed ? prior?.fingerOnly === true : (prior?.fingerOnly ?? true) && weaponId === 'fist' } } };
  if (hpAfter === 1) unlockAchievement(player, 'still_breathing', fight, now);
  if (hpAfter !== 0) return;
  if (bleed) unlockAchievement(player, 'hands_off', fight, now);
  if (lastPoisonSaved && !bleed) unlockAchievement(player, 'greed_saved', fight, now);
  const entries = Object.entries(fight.achievement_combat.contributors);
  if (state.complete && entries.length === 10 && entries.every(([, entry]) => entry.fingerOnly)) {
    for (const [pid] of entries) unlockAchievement(players.find(p => String(p.id) === pid), 'ten_fingers', fight, now);
  }
}

export function claimAchievementReward(player, id, now = Date.now()) {
  const entry = player.player_achievements?.[id];
  if (!ACHIEVEMENT_REWARDS[id] || !entry) throw Object.assign(new Error('ACHIEVEMENT_LOCKED'), {statusCode:403});
  // Older releases already paid automatically; never grant those rewards twice.
  if (entry.reward_status !== 'pending') return { claimed:true, replayed:true };
  const rewards = entry.rewards || ACHIEVEMENT_REWARDS[id];
  const inventory = { ...player.weapon_inventory };
  for (const [key, inventoryId] of Object.entries({smallPoison:'small-poison',mediumPoison:'medium-poison',largePoison:'large-poison'})) {
    if (rewards[key]) inventory[inventoryId] = Math.max(0, Number(inventory[inventoryId] || 0)) + rewards[key];
  }
  player.weapon_inventory = inventory;
  player.roulette_bonus_spins = Math.max(0, Number(player.roulette_bonus_spins || 0)) + (rewards.spins || 0);
  player.player_achievements = {...player.player_achievements,[id]:{...entry,reward_status:'claimed',claimed_at:new Date(now).toISOString()}};
  return {claimed:true,replayed:false};
}
