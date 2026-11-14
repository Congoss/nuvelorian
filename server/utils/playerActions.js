import { kyivDayKey } from "../../src/lib/kyivDay.js";
import { grantTutorialArtifactStarter } from './tutorialArtifactStarter.js';
import { applyWorldAction } from './planetWorld.js';
import { COLLECTION_REWARDS } from '../../src/lib/questCollectionRewards.js';
import { FEATURE_FLAGS } from '../../src/lib/featureFlags.js';
import { HALLOWEEN_EQUIPMENT } from '../../src/lib/halloweenEquipment.js';
import { recordFishingAchievement } from './playerAchievements.js';
import { earnPumpkin, exchangePumpkins, purchasePumpkinReward, claimHalloweenMilestone, claimHalloweenClanReward } from '../../src/lib/halloweenEvent.js';
import { captureDailyTaskProgress, getDailyCompletionReward, getDayTasks, getTaskState, WEEKLY_BONUSES } from '../../src/lib/questNotifications.js';
import { getGlobalWeekMeta } from './globalWeeklyCycle.js';
import { grantXpToPlayer } from './progression.js';
import { getNewbieProgress, SURVIVAL_PACK } from '../../src/lib/newbieQuest.js';
import { dailyShopOffers } from '../../src/lib/dailyShopOffers.js';
import { claimPassiveReward } from './passiveRewards.js';
import { TUTORIAL_STEPS } from '../../src/lib/tutorialProgress.js';
import { eventPhase } from '../../src/lib/eventSchedule.js';
import { friday13SalePrice, isFriday13SaleActive } from '../../src/lib/friday13Event.js';
import { SHKRABAN_ENABLED, SHKRABAN_HERO_AVATAR, ownsShkrabanHead } from '../../src/lib/shkrabanContent.js';

const GUIDE_STEPS = {
  'spend-energy': { ready: (p) => Number(p.energy_spent_total || 0) >= 100, reward: { tentacles: 40, energy: 25, smallPoison: 2 } },
  'slap-player': { ready: () => true, reward: { energy: 35 } },
  'open-box': { ready: (p) => Number(p.opened_boxes_total || 0) >= 1, reward: { strength: 10, energy: 25 } },
  'gain-strength': { ready: (p) => Number(p.stat_strength || 1) >= 25, reward: { strength: 100, mediumPoison: 1, energy: 40 } },
  'boss-damage': { ready: (p) => Number(p.boss_damage_lifetime || p.total_boss_damage || 0) >= 100, reward: { factoryKey: 1, energy: 50 } },
  'join-clan': { ready: (p) => Boolean(p.clan_name || p.clan_id), reward: { tentacles: 100, energy: 30 } },
};
const GUIDE_FINAL_REWARD = { tentacles: 300, energy: 140, strength: 50, starterSetFragments: 1, smallPoison: 8, mediumPoison: 2, factoryKey: 2, beachBox: 1 };

const FISH_SINGLE = {
  trash: { xp: 10 }, common: { xp: 25 }, uncommon: { energy: 20 }, rare: { smallPoison: 3 },
  epic: { mediumPoison: 2 }, mythic: { largePoison: 1 }, legendary: { largePoison: 3 }, black_hole: { smallPoison: 8, mediumPoison: 4, largePoison: 2 },
};
const FISH_COMBO = {
  combo_2: { fishes: ['common', 'uncommon'], reward: { xp: 50, energy: 25 } },
  combo_3: { fishes: ['common', 'uncommon', 'rare'], reward: { xp: 100, smallPoison: 2 } },
  combo_4: { fishes: ['common', 'uncommon', 'rare', 'epic'], reward: { xp: 150, energy: 25, mediumPoison: 2 } },
  combo_5: { fishes: ['common', 'uncommon', 'rare', 'epic', 'mythic'], reward: { xp: 250, mediumPoison: 2, largePoison: 1 } },
  combo_6: { fishes: ['common', 'uncommon', 'rare', 'epic', 'mythic', 'legendary'], reward: { xp: 500, energy: 100, smallPoison: 6, mediumPoison: 4, largePoison: 2 } },
  combo_7: { fishes: ['common', 'uncommon', 'rare', 'epic', 'mythic', 'legendary', 'black_hole'], reward: { xp: 1000, energy: 250, freeSpins: 20, largePoison: 10 } },
};
const FISH_RARITY_NORMAL = { trash: 35, common: 25, uncommon: 16, rare: 10, epic: 7, mythic: 4, legendary: 2, black_hole: 1 };
const FISH_RARITY_HOOK = { trash: 22, common: 24, uncommon: 18, rare: 14, epic: 10, mythic: 7, legendary: 3.5, black_hole: 1.5 };
const FISH_BONUS_CATCH = { nothing: 60, xp50: 15, energy5: 10, smallPoison: 7, mediumPoison: 4, strength1: 2, largePoison: 1.5, energy25: 0.5 };
const FISH_BONUS_MISS = { xp50: 35, energy5: 25, smallPoison: 15, mediumPoison: 10, xp100: 7, energy15: 5, strength1: 2, largePoison: 1 };
const FIXED_SHOP = Object.freeze({
  popular_daily_toxic: { cost: 15000, currency: 'tentacles', limit: 1, limitKey: 'daily_toxic_pack', box: true },
  daily_toxic_pack: { cost: 15000, currency: 'tentacles', limit: 1, box: true },
  popular_spin_5: { cost: 50, currency: 'premium', spins: 5 },
  offer_starter: { cost: 39, currency: 'premium', box: true },
  offer_boss1: { cost: 69, currency: 'premium', box: true },
  offer_weekly: { cost: 119, currency: 'premium', box: true },
  spin_1: { cost: 10000, currency: 'tentacles', limit: 5, spins: 1 },
  spin_5: { cost: 50000, currency: 'tentacles', limit: 5, spins: 5 },
  spin_20: { cost: 200000, currency: 'tentacles', limit: 5, spins: 20 },
  pack_poison: { cost: 49, currency: 'premium', box: true },
  pack_boss_damage: { cost: 79, currency: 'premium', box: true },
  pack_weekly_progress: { cost: 299, currency: 'premium', box: true },
});
const SHOP_PACK_DROPS = Object.freeze({
  daily_toxic_pack: [{ type: 'weapon', id: 'satchel', qty: 4 }, { type: 'weapon', id: 'f1', qty: 1 }, { type: 'energy', qty: 50 }],
  pack_poison: [{ type: 'weapon', id: 'satchel', qty: 10 }, { type: 'weapon', id: 'f1', qty: 4 }, { type: 'weapon', id: 'c4', qty: 1 }, { type: 'tentacles', qty: 750 }],
  pack_boss_damage: [{ type: 'energy', qty: 150 }, { type: 'tentacles', qty: 3500 }, { type: 'weapon', id: 'satchel', qty: 15 }, { type: 'weapon', id: 'f1', qty: 6 }, { type: 'weapon', id: 'c4', qty: 2 }, { type: 'spin', qty: 1 }],
  pack_weekly_progress: [{ type: 'energy', qty: 900 }, { type: 'tentacles', qty: 30000 }, { type: 'weapon', id: 'satchel', qty: 70 }, { type: 'weapon', id: 'f1', qty: 30 }, { type: 'weapon', id: 'c4', qty: 10 }, { type: 'spin', qty: 10 }],
  offer_starter: [{ type: 'energy', qty: 120 }, { type: 'tentacles', qty: 3000 }, { type: 'weapon', id: 'satchel', qty: 10 }, { type: 'weapon', id: 'f1', qty: 3 }, { type: 'spin', qty: 3 }],
  offer_boss1: [{ type: 'energy', qty: 220 }, { type: 'tentacles', qty: 6000 }, { type: 'weapon', id: 'satchel', qty: 16 }, { type: 'weapon', id: 'f1', qty: 6 }, { type: 'weapon', id: 'c4', qty: 1 }, { type: 'spin', qty: 2 }],
  offer_weekly: [{ type: 'energy', qty: 350 }, { type: 'tentacles', qty: 9000 }, { type: 'weapon', id: 'satchel', qty: 24 }, { type: 'weapon', id: 'f1', qty: 10 }, { type: 'weapon', id: 'c4', qty: 3 }, { type: 'spin', qty: 6 }],
});
const SHOP_PACK_ALIASES = Object.freeze({ popular_daily_toxic: 'daily_toxic_pack' });

function actionError(code, message, statusCode = 409) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  throw error;
}

function addReward(player, reward = {}) {
  if (reward.enhancementGums) {
    player.enhancement_gums = { ...player.enhancement_gums };
    for (const [type, amount] of Object.entries(reward.enhancementGums)) {
      player.enhancement_gums[type] = Number(player.enhancement_gums[type] || 0) + amount;
    }
  }
  if (reward.equipmentItem) {
    const item = HALLOWEEN_EQUIPMENT.find(entry => entry.id === reward.equipmentItem);
    if (!item) throw new Error('Unknown Halloween equipment');
    if (!(player.inventory_items || []).some(entry => entry.id === item.id)) player.inventory_items = [...(player.inventory_items || []), {...item,type:'equipment',locked:false,count:1}];
  }
  if (reward.xp) grantXpToPlayer(player, Number(reward.xp));
  if (reward.tentacles) player.tentacles = Number(player.tentacles || 0) + Number(reward.tentacles);
  if (reward.premium) player.premium = Number(player.premium || 0) + Number(reward.premium);
  if (reward.energy || reward.fullEnergy) {
    player.energy = reward.fullEnergy
      ? Math.max(Number(player.energy || 0), Number(player.max_energy || 100))
      : Number(player.energy || 0) + Number(reward.energy);
    player.last_energy_update = new Date().toISOString();
  }
  if (reward.strength) player.stat_strength = Number(player.stat_strength || 1) + Number(reward.strength);
  if (reward.freeSpins) player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + Number(reward.freeSpins);
  if (reward.starterSetFragments) player.starter_set_fragments = Number(player.starter_set_fragments || 0) + Number(reward.starterSetFragments);
  if (reward.factoryKey) player.keycards = { ...(player.keycards || {}), factory: Number(player.keycards?.factory || 0) + Number(reward.factoryKey) };
  if (reward.beachBox) player.collection_boxes = { ...(player.collection_boxes || {}), beach: Number(player.collection_boxes?.beach || 0) + Number(reward.beachBox) };
  const poisons = { 'small-poison': reward.smallPoison || reward.small || 0, 'medium-poison': reward.mediumPoison || reward.medium || 0, 'large-poison': reward.largePoison || reward.large || 0 };
  if (Object.values(poisons).some(Boolean)) {
    const inventory = { ...(player.weapon_inventory || {}) };
    for (const [id, amount] of Object.entries(poisons)) if (amount) inventory[id] = Number(inventory[id] || 0) + Number(amount);
    player.weapon_inventory = inventory;
  }
}

function pickWeighted(weights) {
  let roll = Math.random() * Object.values(weights).reduce((sum, value) => sum + value, 0);
  for (const [key, weight] of Object.entries(weights)) { roll -= weight; if (roll <= 0) return key; }
  return Object.keys(weights).at(-1);
}

function dailyState(player, weekKey) {
  return player.daily_event_week === weekKey ? player.daily_event || {} : {};
}

export function applyPlayerAction(player, action = {}, context = {}) {
  if (['world-move', 'world-build', 'world-rest', 'world-return'].includes(action.type)) return applyWorldAction(player, action);
  if(action.type==='update-notice-read'){
    if(!['ship-forge-v1','ca-rank-backfill-v1'].includes(action.noticeId))actionError('NOTICE_INVALID','Unknown announcement',400);
    player.update_notices={...player.update_notices,[action.noticeId]:player.update_notices?.[action.noticeId]||new Date().toISOString()};
    return {read:true};
  }
  const type = String(action.type || '');
  if (type === 'equip-shkraban-avatar') {
    if (!SHKRABAN_ENABLED || !ownsShkrabanHead(player)) actionError('AVATAR_NOT_OWNED', 'Shkraban head is required', 403);
    player.avatar = SHKRABAN_HERO_AVATAR;
    return { avatar: player.avatar };
  }
  if (type.startsWith('halloween-') && !FEATURE_FLAGS.halloween) actionError('EVENT_INACTIVE', 'Event is not available');
  if (type === 'tutorial-auto-quests') {
    grantTutorialArtifactStarter(player);
    return {completed:Boolean(player.tutorial_auto_quests_completed)};
  }
  if (type === 'tutorial-skip') {
    // Player chose to skip the guide: keep the starter artifacts and welcome energy it would have given.
    if (!player.tutorial_disabled && !player.tutorial_level_eight_reward_claimed) {
      grantTutorialArtifactStarter(player);
      if (!player.welcome_energy_granted) {
        player.energy = Math.max(0, Number(player.energy) || 0) + 131;
        player.welcome_energy_granted = true;
        player.last_energy_update = new Date().toISOString();
      }
      player.tutorial_disabled = true;
      player.tutorial_disabled_at = new Date().toISOString();
      player.tutorial_skipped_by_player = true;
      player.tutorial_step = 'completed';
    }
    return { skipped: true };
  }
  if (type === 'tutorial-progress') {
    if (!TUTORIAL_STEPS.has(action.step)) actionError('TUTORIAL_STEP_INVALID', 'Invalid tutorial step', 400);
    if (['artifacts','claim-reward'].includes(action.step)) grantTutorialArtifactStarter(player);
    player.tutorial_step = action.step;
    if (action.step === 'boss-poison' && !player.tutorial_poison_grant_version && !player.tutorial_disabled && !player.tutorial_level_eight_reward_claimed) {
      addReward(player, { largePoison: 5 });
      player.tutorial_poison_granted = true;
      player.tutorial_poison_grant_version = 1;
    }
    return { step: action.step };
  }
  if (type === 'claim-afk') {
    const reward = claimPassiveReward(player);
    addReward(player, reward);
    return { reward };
  }
  if (type === 'shop-daily') {
    const today = kyivDayKey();
    const offer = dailyShopOffers(player, today).find((entry) => entry.id === String(action.itemId || ''));
    if (!offer) actionError('SHOP_ITEM_INVALID', 'Daily offer is unavailable', 400);
    const purchases = player.daily_shop_date === today ? [...(player.daily_shop_purchases || [])] : [];
    if (purchases.includes(offer.id)) actionError('SHOP_DAILY_LIMIT', 'Daily offer already purchased');
    const currency = offer.paymentCurrency === 'tentacles' ? 'tentacles' : 'premium';
    const baseCost = offer.kind === 'equipment' ? offer.premium : Number(offer.cost?.[currency] || 0);
    const cost = isFriday13SaleActive() ? friday13SalePrice(baseCost) : baseCost;
    if (!Number.isFinite(cost) || cost <= 0) actionError('SHOP_ITEM_INVALID', 'Daily offer price is invalid', 400);
    if (Number(player[currency] || 0) < cost) actionError('SHOP_INSUFFICIENT_FUNDS', 'Not enough currency');
    player[currency] = Number(player[currency] || 0) - cost;
    if (offer.kind === 'energy') addReward(player, { energy: offer.qty });
    else if (offer.kind === 'poison') {
      const inventory = { ...(player.weapon_inventory || {}) };
      inventory[offer.poisonId] = Number(inventory[offer.poisonId] || 0) + offer.qty;
      player.weapon_inventory = inventory;
    } else if (offer.kind === 'keycard') {
      const location = offer.boss.keycardLocation;
      player.keycards = { ...(player.keycards || {}), [location]: Number(player.keycards?.[location] || 0) + 1 };
    } else if (offer.kind === 'equipment') {
      const inventory = Array.isArray(player.inventory_items) ? [...player.inventory_items] : [];
      const index = inventory.findIndex((item) => item?.id === offer.item.id);
      if (index >= 0) inventory[index] = { ...inventory[index], count: Number(inventory[index].count || 0) + 1 };
      else inventory.push({ id: offer.item.id, slot: offer.item.slot, setId: offer.item.setId, type: 'equipment', locked: false, count: 1 });
      player.inventory_items = inventory;
    }
    player.daily_shop_date = today;
    player.daily_shop_purchases = [...purchases, offer.id];
    return { reward: { itemId: offer.id, kind: offer.kind, qty: offer.qty || 1 } };
  }
  if (type === 'shop-open') {
    const id = String(action.itemId || '');
    const drops = SHOP_PACK_DROPS[SHOP_PACK_ALIASES[id] || id];
    if (!drops) actionError('SHOP_ITEM_INVALID', 'Unknown shop box', 400);
    const inventory = Array.isArray(player.inventory_items) ? [...player.inventory_items] : [];
    const index = inventory.findIndex((item) => String(item?.id || '') === id && Number(item?.count || 0) > 0);
    if (index < 0) actionError('SHOP_BOX_NOT_OWNED', 'Shop box not owned');
    const nextCount = Number(inventory[index].count) - 1;
    if (nextCount) inventory[index] = { ...inventory[index], count: nextCount };
    else inventory.splice(index, 1);
    player.inventory_items = inventory;
    for (const drop of drops) {
      if (drop.type === 'weapon') {
        const weaponId = { satchel: 'small-poison', f1: 'medium-poison', c4: 'large-poison' }[drop.id];
        player.weapon_inventory = { ...(player.weapon_inventory || {}), [weaponId]: Number(player.weapon_inventory?.[weaponId] || 0) + drop.qty };
      } else if (drop.type === 'spin') addReward(player, { freeSpins: drop.qty });
      else addReward(player, { [drop.type]: drop.qty });
    }
    player.opened_boxes_total = Number(player.opened_boxes_total || 0) + 1;
    return { reward: { drops } };
  }
  if (type === 'shop-fixed') {
    const id = String(action.itemId || '');
    const offer = FIXED_SHOP[id];
    if (!offer) actionError('SHOP_ITEM_INVALID', 'Unknown shop item', 400);
    const today = kyivDayKey();
    const counts = player.shop_daily_limits?.day === today ? { ...(player.shop_daily_limits.counts || {}) } : {};
    const limitKey = offer.limitKey || id;
    if (offer.limit && Number(counts[limitKey] || 0) >= offer.limit) actionError('SHOP_DAILY_LIMIT', 'Daily limit reached');
    const cost = isFriday13SaleActive() ? friday13SalePrice(offer.cost) : offer.cost;
    if (Number(player[offer.currency] || 0) < cost) actionError('SHOP_INSUFFICIENT_FUNDS', 'Not enough currency');
    player[offer.currency] = Number(player[offer.currency] || 0) - cost;
    if (offer.limit) player.shop_daily_limits = { day: today, counts: { ...counts, [limitKey]: Number(counts[limitKey] || 0) + 1 } };
    if (offer.spins) player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + offer.spins;
    if (offer.box) {
      const inventory = Array.isArray(player.inventory_items) ? [...player.inventory_items] : [];
      const index = inventory.findIndex((item) => String(item?.id || '') === id);
      if (index >= 0) inventory[index] = { ...inventory[index], count: Number(inventory[index].count || 0) + 1 };
      else inventory.push({ id, name: id, type: 'box', count: 1 });
      player.inventory_items = inventory;
    }
    return { reward: { itemId: id, box: Boolean(offer.box), spins: offer.spins || 0 } };
  }
  if (type === 'shop-energy') {
    actionError('SHOP_ITEM_INVALID', 'Energy shop offers are no longer available', 400);
  }
  if (type === 'tutorial-final') {
    if (player.tutorial_level_eight_reward_claimed) actionError('TUTORIAL_ALREADY_CLAIMED', 'Tutorial reward already claimed');
    if (Number(player.level || 1) < 8) actionError('TUTORIAL_LEVEL_REQUIRED', 'Level 8 required');
    const reward = { tentacles: 10000, premium: 10, strength: 100, xp: 200, energy: 100, freeSpins: 2, smallPoison: 10, mediumPoison: 5, largePoison: 3 };
    addReward(player, reward);
    player.tutorial_level_eight_reward_claimed = true;
    return { reward };
  }
  if (type === 'clean-puddle') { player.puddle_active = false; return {}; }
  if (type === 'newbie-visit') {
    const key = action.target === 'hero' ? 'hero_views' : action.target === 'boss' ? 'boss_tab_opens' : null;
    if (!key) actionError('NEWBIE_VISIT_INVALID', 'Unknown visit', 400);
    player.newbie_stats = { ...(player.newbie_stats || {}), [key]: Math.max(1, Number(player.newbie_stats?.[key] || 0)) };
    return {};
  }
  if (type === 'newbie-quest' || type === 'newbie-part') {
    const progress = getNewbieProgress(player);
    const part = progress.activePart;
    if (type === 'newbie-quest') {
      const quest = progress.activeQuest;
      if (!quest || quest.id !== Number(action.questId) || !quest.done || quest.claimed) actionError('NEWBIE_QUEST_UNAVAILABLE', 'Quest unavailable');
      addReward(player, quest.reward);
      player.newbie_claimed_quests = [...(player.newbie_claimed_quests || []), quest.id];
      return { reward: quest.reward };
    }
    if (!part || part.id !== Number(action.partId) || !part.allClaimed || part.partClaimed) actionError('NEWBIE_PART_UNAVAILABLE', 'Part unavailable');
    addReward(player, part.partReward);
    player.newbie_claimed_parts = [...(player.newbie_claimed_parts || []), part.id];
    player.unopened_newbie_packs = [...(player.unopened_newbie_packs || []), part.packLabel];
    if (part.id === 4 && !player.newbie_survival_claimed) {
      addReward(player, SURVIVAL_PACK);
      player.unopened_newbie_packs = [...player.unopened_newbie_packs, 'NEWBIE SURVIVAL PACK'];
      player.newbie_survival_claimed = true;
    }
    return { reward: part.partReward };
  }
  if (type === 'halloween-clan') { const reward = claimHalloweenClanReward(player, Number(context.halloweenClanTotal || 0)); addReward(player, reward); return { reward }; }
  if (type === 'halloween-milestone') { const reward = claimHalloweenMilestone(player, action.goal); addReward(player, reward); return { reward }; }
  if (type === 'halloween-exchange' || type === 'halloween-buy') {
    if (typeof action.requestId !== 'string' || !/^[a-zA-Z0-9_-]{12,80}$/.test(action.requestId)) actionError('HALLOWEEN_REQUEST_INVALID', 'Invalid request id');
    const previous = player.halloween_requests?.[action.requestId];
    if (previous) {
      if (previous.type !== type || (previous.resource || 'tentacles') !== (action.resource || 'tentacles') || previous.quantity !== action.quantity || previous.productId !== action.productId) actionError('HALLOWEEN_REQUEST_REUSED', 'Request id already used');
      return { ...previous.result, replayed: true };
    }
    let result;
    if (type === 'halloween-exchange') result = exchangePumpkins(player, action.quantity, Date.now(), action.resource || 'tentacles');
    else { const reward = purchasePumpkinReward(player, action.productId); addReward(player, reward); result = { reward }; }
    player.halloween_requests = { ...(player.halloween_requests || {}), [action.requestId]: { type, resource: action.resource, quantity: action.quantity, productId: action.productId, result } };
    return result;
  }
  if (type === 'daily-task') {
    const meta = getGlobalWeekMeta();
    const day = Number(action.day);
    if (!Number.isInteger(day) || day < 1 || day > meta.currentDayIndex) actionError('DAILY_DAY_INVALID', 'Day is locked');
    captureDailyTaskProgress(player, meta);
    const state = dailyState(player, meta.currentWeekKey);
    const claimed = state.claimedRewards?.[day] || [];
    const task = getDayTasks(day).find((item) => item.id === action.taskId);
    if (!task) actionError('DAILY_TASK_UNKNOWN', 'Daily task is not available on this server');
    if (claimed.includes(task.id)) return { alreadyClaimed: true };
    const view = { ...player, currentDateKey: meta.currentDateKey, currentWeekKey: meta.currentWeekKey };
    if (!getTaskState(view, task, day, meta.currentDayIndex, claimed).claimable) actionError('DAILY_TASK_INCOMPLETE', 'Task is incomplete');
    const pumpkins = task.baseId !== 'checkin' ? earnPumpkin(player, 'daily') : 0;
    if (task.baseId === 'checkin') player.daily_event_last_claim = meta.currentDateKey;
    addReward(player, { xp: task.xp, tentacles: task.tentacles, energy: task.energyBonus, freeSpins: 1 });
    player.daily_event_week = meta.currentWeekKey;
    player.daily_event_day = meta.currentDayIndex;
    player.daily_event = { ...state, claimedRewards: { ...(state.claimedRewards || {}), [day]: [...claimed, task.id] } };
    return { reward: { xp: task.xp, tentacles: task.tentacles, energy: task.energyBonus, freeSpins: 1, pumpkins } };
  }
  if (type === 'daily-day' || type === 'daily-bonus') {
    const meta = getGlobalWeekMeta();
    const state = dailyState(player, meta.currentWeekKey);
    const fullDays = state.fullDays || [];
    if (type === 'daily-day') {
      const day = Number(action.day);
      if (!Number.isInteger(day) || day < 1 || day > meta.currentDayIndex || fullDays.includes(day)) actionError('DAILY_DAY_UNAVAILABLE', 'Day unavailable');
      const claimed = state.claimedRewards?.[day] || [];
      const ready = getDayTasks(day).every((task) => claimed.includes(task.id));
      if (!ready) actionError('DAILY_DAY_INCOMPLETE', 'Not all daily tasks claimed');
      player.daily_event_week = meta.currentWeekKey;
      const reward = getDailyCompletionReward(day);
      addReward(player, reward);
      player.daily_event = { ...state, fullDays: [...fullDays, day] };
      return { reward };
    }
    const bonus = WEEKLY_BONUSES.find((item) => item.fullDays === Number(action.fullDays));
    if (!bonus || fullDays.length < bonus.fullDays || (state.claimedBonuses || []).includes(bonus.fullDays)) actionError('DAILY_BONUS_UNAVAILABLE', 'Bonus unavailable');
    addReward(player, bonus.reward);
    player.daily_event_week = meta.currentWeekKey;
    player.daily_event = { ...state, claimedBonuses: [...(state.claimedBonuses || []), bonus.fullDays] };
    return { reward: bonus.reward };
  }
  if (type === 'guide-step' || type === 'guide-final') {
    const claimed = Array.isArray(player.starter_guide_claimed) ? player.starter_guide_claimed : [];
    if (type === 'guide-final') {
      if (player.starter_guide_final_claimed || Object.keys(GUIDE_STEPS).some((id) => !claimed.includes(id))) actionError('GUIDE_FINAL_UNAVAILABLE', 'Guide is incomplete');
      addReward(player, GUIDE_FINAL_REWARD);
      player.starter_guide_final_claimed = true;
      return { reward: GUIDE_FINAL_REWARD };
    }
    const step = GUIDE_STEPS[action.stepId];
    if (!step || claimed.includes(action.stepId) || !step.ready(player)) actionError('GUIDE_STEP_UNAVAILABLE', 'Guide step is unavailable');
    if (action.stepId === 'slap-player') player.social_slaps_total = Number(player.social_slaps_total || 0) + 1;
    addReward(player, step.reward);
    player.starter_guide_claimed = [...claimed, action.stepId];
    return { reward: step.reward };
  }
  if (type === 'collection-claim') {
    const count = action.count ?? 1;
    if (!Number.isSafeInteger(count)||count<1) actionError('COLLECTION_COUNT_INVALID', 'Invalid collection claim count', 400);
    if(action.requestId){const prior=player.collection_claim_receipts?.[action.requestId];if(prior){if(prior.locationId!==action.locationId||prior.count!==count)actionError('COLLECTION_COUNT_INVALID','Request reused',409);return {reward:COLLECTION_REWARDS[prior.locationId],replayed:true};}}
    const location = String(action.locationId || '');
    const reward = COLLECTION_REWARDS[location];
    if (!reward) actionError('COLLECTION_LOCATION_INVALID', 'Unknown location', 400);
    const counts = { ...(player.collection_item_counts || {}) };
    const items = Array.from({ length: 7 }, (_, i) => `${location}-artifact-${i + 1}`);
    if (items.some((id) => Number(counts[id] || 0) < count)) actionError('COLLECTION_INCOMPLETE', 'Collection is incomplete');
    for (const id of items) counts[id] -= count;
    player.collection_item_counts = counts;
    player.collection_items = Object.keys(counts).filter((id) => Number(counts[id]) > 0);
    const { weapon, ...resourceReward } = reward;
    addReward(player, Object.fromEntries(Object.entries(resourceReward).map(([key, value]) => [key, value * count])));
    const inventory = { ...(player.weapon_inventory || {}) };
    inventory[weapon[0]] = Number(inventory[weapon[0]] || 0) + weapon[1] * count;
    player.weapon_inventory = inventory;
    player.collection_rewards_claimed = { ...(player.collection_rewards_claimed || {}), [location]: Number(player.collection_rewards_claimed?.[location] || 0) + count };
    if(action.requestId)player.collection_claim_receipts={...player.collection_claim_receipts,[action.requestId]:{locationId:location,count}};
    return { reward };
  }
  if (type === 'fishing-cast') {
    if (eventPhase('space-fishing') !== 'active') actionError('EVENT_INACTIVE', 'Fishing event is not active');
    if (player.cosmo_fishing_cycle?.startAt && !player.cosmo_fishing_cycle?.claimed) actionError('FISHING_ACTIVE', 'Fishing already active');
    const now = Date.now();
    const hookStartAt = now + (3 + Math.floor(Math.random() * 17)) * 60_000;
    player.cosmo_fishing_cycle = { startAt: now, finishAt: now + 20 * 60_000, hookStartAt, hookEndAt: hookStartAt + 60_000, resolved: false, claimed: false, hookHit: false };
    player.cosmo_fishing_last_result = null;
    player.cosmo_fishing_last_result_seen = true;
    return {};
  }
  if (type === 'fishing-resolve') {
    const cycle = player.cosmo_fishing_cycle;
    const now = Date.now();
    if (!cycle?.startAt || cycle.claimed || cycle.resolved) actionError('FISHING_NOT_ACTIVE', 'Fishing not active');
    const hook = now >= cycle.hookStartAt && now < cycle.hookEndAt;
    if (!hook && now < cycle.finishAt) actionError('FISHING_TOO_EARLY', 'Fish is not ready');
    const caught = Math.random() * 100 < (hook ? 95 : 80);
    const rarity = caught ? pickWeighted(hook ? FISH_RARITY_HOOK : FISH_RARITY_NORMAL) : null;
    recordFishingAchievement(player, caught, now, rarity);
    const bonusKey = pickWeighted(caught ? FISH_BONUS_CATCH : FISH_BONUS_MISS);
    const bonus = { xp: bonusKey === 'xp50' ? 50 : bonusKey === 'xp100' ? 100 : 0, energy: bonusKey === 'energy5' ? 5 : bonusKey === 'energy15' ? 15 : bonusKey === 'energy25' ? 25 : 0, strength: bonusKey === 'strength1' ? 10 : 0, smallPoison: bonusKey === 'smallPoison' ? 1 : 0, mediumPoison: bonusKey === 'mediumPoison' ? 1 : 0, largePoison: bonusKey === 'largePoison' ? 1 : 0 };
    addReward(player, bonus);
    if (rarity) {
      player.cosmo_fishing_caught_total = Number(player.cosmo_fishing_caught_total || 0) + 1;
      const inventory = { ...(player.cosmofish_inventory || player.cosmo_fish_inventory || {}) };
      inventory[rarity] = Number(inventory[rarity] || 0) + 1;
      player.cosmofish_inventory = inventory;
      player.cosmo_fish_inventory = inventory;
    }
    const pumpkins = caught ? earnPumpkin(player, 'fishing') : 0;
    player.cosmo_fishing_cycle = { ...cycle, resolved: true, claimed: true, resolvedAt: now, hookHit: hook };
    const bonusLabel = ({ xp50: 'EXP +50', xp100: 'EXP +100', energy5: 'Energy +5', energy15: 'Energy +15', energy25: 'Energy +25', smallPoison: 'Small poison x1', mediumPoison: 'Medium poison x1', largePoison: 'Poison flask x1', strength1: 'Strength +10', nothing: 'Nothing' })[bonusKey] || 'Nothing';
    player.cosmo_fishing_last_result = { caught, rarity, bonusKey, bonusLabel, pumpkins, resolvedAt: now };
    player.cosmo_fishing_last_result_seen = false;
    return { result: player.cosmo_fishing_last_result, reward: bonus };
  }
  if (type === 'fishing-seen') {
    player.cosmo_fishing_last_result_seen = true;
    return {};
  }
  if (type === 'fishing-exchange') {
    const single = FISH_SINGLE[action.rarity];
    const combo = FISH_COMBO[action.comboKey];
    if (!single && !combo) actionError('FISH_EXCHANGE_INVALID', 'Unknown exchange', 400);
    const fishes = combo?.fishes || [action.rarity];
    const inventory = { ...(player.cosmofish_inventory || player.cosmo_fish_inventory || {}) };
    if (fishes.some((rarity) => Number(inventory[rarity] || 0) < 1)) actionError('FISH_EXCHANGE_EMPTY', 'Not enough fish');
    for (const rarity of fishes) inventory[rarity] -= 1;
    player.cosmofish_inventory = inventory;
    player.cosmo_fish_inventory = inventory;
    const reward = combo?.reward || single;
    addReward(player, reward);
    return { reward };
  }
  actionError('PLAYER_ACTION_UNKNOWN', 'Unknown player action', 400);
}
