import { kyivDayKey } from "./kyivDay.js";
import { FEATURE_FLAGS } from './featureFlags.js';
import { HALLOWEEN_SET_ITEMS } from './halloweenEquipment.js';
export const HALLOWEEN = Object.freeze({
  id: 'halloween-2026', startAt: '2026-10-21T00:00:00.000Z', endAt: '2026-11-03T22:20:00.000Z',
  shopEndAt: '2026-11-06T22:20:00.000Z',
  paperExchangeRate: 1, exchangeRate: 25000, exchangePerDay: 15, exchangeCarryDays: 3,
  sources: { boss: { chance: .35, cap: 20, pity: 5 }, quest: { chance: .5, cap: 20, pity: 3 }, fishing: { chance: .5, cap: 8, pity: 3 }, daily: { chance: 1, cap: 12, pity: 1 } },
  milestones: [
    { goal: 10, reward: { smallPoison: 2 } }, { goal: 25, reward: { energy: 50 } },
    { goal: 50, reward: { mediumPoison: 1 } }, { goal: 100, reward: { largePoison: 1 } },
  ],
  products: [
    ...HALLOWEEN_SET_ITEMS.map(item=>({id:'halloween-set-'+item.slot,price:50,limit:1,minActivity:30,reward:{equipmentItem:item.id}})),
    { id:'halloween-pet', price:200, limit:1, minActivity:140, reward:{equipmentItem:'halloween_2026_pet'} },
    { id: 'energy', price: 10, limit: 10, reward: { energy: 50 } },
    { id: 'small', price: 15, reward: { smallPoison: 3 } },
    { id: 'medium', price: 30, reward: { mediumPoison: 2 } },
    { id: 'large', price: 50, reward: { largePoison: 2 } },
    { id: 'gum-normal', price: 75, reward: { enhancementGums: { normal: 1 } } },
    { id: 'gum-improved', price: 150, reward: { enhancementGums: { improved: 1 } } },
    { id: 'energy-remainder', price: 1, spendBalance: true, reward: { energy: 5 } },
    { id: 'spins', price: 100, limit: 2, reward: { freeSpins: 5 } },
  ],
});
const DAY = 86400000;
export const halloweenActive = (now = Date.now()) => FEATURE_FLAGS.halloween && now >= Date.parse(HALLOWEEN.startAt) && now < Date.parse(HALLOWEEN.endAt);
export const halloweenShopOpen = (now = Date.now()) => FEATURE_FLAGS.halloween && now >= Date.parse(HALLOWEEN.startAt) && now < Date.parse(HALLOWEEN.shopEndAt);
const dayKey = now => kyivDayKey(now);
const eventDay = now => Math.max(0, Math.floor((now - Date.parse(HALLOWEEN.startAt)) / DAY));
export function halloweenState(player, now = Date.now()) {
  const saved = player.halloween_event?.id === HALLOWEEN.id ? player.halloween_event : {};
  const purchaseSpend = HALLOWEEN.products.reduce((sum, product) => sum + Number(saved.purchases?.[product.id] || 0) * product.price, 0);
  const activityEarned = saved.activityEarned ?? Math.max(0, Number(saved.earned || 0) - purchaseSpend);
  const elapsed = saved.exchangeDay == null ? eventDay(now) : Math.max(0, eventDay(now) - saved.exchangeDay);
  const exchangeAvailable = Math.min(HALLOWEEN.exchangePerDay * HALLOWEEN.exchangeCarryDays, (saved.exchangeLeft ?? HALLOWEEN.exchangePerDay) + elapsed * HALLOWEEN.exchangePerDay);
  return { ...saved, id: HALLOWEEN.id, balance: saved.balance || 0, earned: saved.earned || 0, activityEarned, activityTotal: Math.max(Number(saved.activityTotal || 0), Number(saved.earned || 0)), exchangeAvailable, exchangeDay: eventDay(now),
    daily: saved.date === dayKey(now) ? { ...(saved.daily || {}) } : {}, date: dayKey(now), purchases: { ...(saved.purchases || {}) }, misses: { ...(saved.misses || {}) }, trio: saved.date === dayKey(now) && Boolean(saved.trio) };
}
function save(player, state) { const { exchangeAvailable, ...rest } = state; player.halloween_event = { ...rest, exchangeLeft: exchangeAvailable }; }
export function grantHalloweenPumpkins(player, amount = 1, now = Date.now()) {
  if (!halloweenActive(now)) return 0;
  const quantity = Math.max(0, Math.floor(Number(amount) || 0));
  if (!quantity) return 0;
  const state = halloweenState(player, now);
  state.balance += quantity; state.earned += quantity;
  state.activityEarned = Number(state.activityEarned || 0) + quantity;
  state.activityTotal = Number(state.activityTotal || 0) + quantity;
  save(player, state); return quantity;
}
export function earnPumpkin(player, source, { now = Date.now(), rng = Math.random } = {}) {
  const config = HALLOWEEN.sources[source];
  if (!halloweenActive(now) || !config) return 0;
  const state = halloweenState(player, now);
  if ((state.daily[source] || 0) >= config.cap) return 0;
  state.misses[source] = (state.misses[source] || 0) + 1;
  let amount = 0;
  if (rng() < config.chance || state.misses[source] >= config.pity) {
    amount = 1; state.misses[source] = 0;
    state.daily[source] = (state.daily[source] || 0) + 1;
    state.balance++; state.earned++; state.activityEarned = (state.activityEarned || 0) + 1; state.activityTotal = (state.activityTotal || 0) + 1;

  }
  save(player, state); return amount;
}
export function exchangePumpkins(player, quantity, now = Date.now(), resource = 'tentacles') {
  if (!halloweenActive(now)) throw new Error('Halloween event is closed');
  const state = halloweenState(player, now);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > state.exchangeAvailable) throw new Error('Pumpkin exchange limit exceeded');
  if (!['tentacles', 'paper'].includes(resource)) throw new Error('Invalid exchange resource');
  const field = resource === 'paper' ? 'premium' : 'tentacles';
  const cost = quantity * (resource === 'paper' ? HALLOWEEN.paperExchangeRate : HALLOWEEN.exchangeRate);
  if (Number(player[field] || 0) < cost) throw new Error('Not enough currency');
  player[field] = Number(player[field] || 0) - cost; state.exchangeAvailable -= quantity; state.balance += quantity; state.earned += quantity;
  state.activityEarned = Number(state.activityEarned || 0) + quantity;
  state.activityTotal = Number(state.activityTotal || 0) + quantity;
  save(player, state); return { pumpkins: quantity, cost };
}
export function purchasePumpkinReward(player, productId, now = Date.now()) {
  if (!halloweenShopOpen(now)) throw new Error('Halloween event is closed');
  const product = HALLOWEEN.products.find(item => item.id === productId);
  const state = halloweenState(player, now);
  if (!product || (product.limit != null && (state.purchases[productId] || 0) >= product.limit)) throw new Error('Halloween purchase limit reached');
  if ((state.activityTotal || 0) < (product.minActivity || 0)) throw new Error('Earn more pumpkins through activity to unlock this item');
  if (product.reward.equipmentItem && (player.inventory_items || []).some(item => item.id === product.reward.equipmentItem)) throw new Error('Halloween item already owned');
  if (state.balance < product.price) throw new Error('Not enough pumpkins');
  const price = product.spendBalance ? state.balance : product.price;
  state.balance -= price;
  if (halloweenActive(now)) state.activityEarned = Math.max(0, Number(state.activityEarned || 0) - price);
  state.purchases[productId] = (state.purchases[productId] || 0) + 1;
  save(player, state); return product.spendBalance ? { energy: price * product.reward.energy } : product.reward;
}

export function claimHalloweenMilestone(player, goal, now = Date.now()) {
  if (!halloweenActive(now)) throw new Error('Halloween event is closed');
  goal = Number(goal);
  const state = halloweenState(player, now);
  const milestone = HALLOWEEN.milestones.find(item => item.goal === goal);
  if (!milestone || (state.activityTotal || 0) < goal || (state.claimed || []).includes(goal)) throw new Error('Halloween milestone is not available');
  state.claimed = [...(state.claimed || []), goal]; save(player, state); return milestone.reward;
}

export function claimHalloweenClanReward(player, clanTotal, now = Date.now()) {
  if (!halloweenActive(now)) throw new Error('Halloween event is closed');
  const state = halloweenState(player, now);
  if (!player.clan_id || clanTotal < 100 || state.clanRewardClaimed) throw new Error('Clan pumpkin reward is not available');
  state.clanRewardClaimed = true; save(player, state); return { energy: 100, smallPoison: 3 };
}

export function isNewHalloweenReferral(friend, now = Date.now()) {
  const created = Date.parse(friend?.created_date || friend?.created_at || '');
  return Number.isFinite(created) && created >= Date.parse(HALLOWEEN.startAt) && created < Date.parse(HALLOWEEN.endAt) && created <= now;
}
export function grantReferralPumpkins(player, friend, now = Date.now()) {
  if (!halloweenActive(now) || !isNewHalloweenReferral(friend, now) || !friend?.id || String(friend.id) === String(player.id) || Number(friend.level || 0) < 20) return 0;
  const state = halloweenState(player, now);
  if ((state.referralClaims || []).includes(String(friend.id))) return 0;
  state.referralClaims = [...(state.referralClaims || []), String(friend.id)];
  state.balance += 2; state.earned += 2; state.activityEarned = Number(state.activityEarned || 0) + 2; state.activityTotal = Number(state.activityTotal || 0) + 2;
  save(player, state); return 2;
}
