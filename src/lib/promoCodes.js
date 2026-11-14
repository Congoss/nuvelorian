import { GAME_CONFIG } from './gameConfig.js';

export const PROMO_CODES = {
  JOPKA: {
    code: 'JOPKA',
    rewards: [
      { type: 'energy', amount: 100 },
      { type: 'currency', amount: 1500000 },
      { type: 'item', itemId: 'small-poison', amount: 3 },
      { type: 'item', itemId: 'medium-poison', amount: 2 },
      { type: 'item', itemId: 'large-poison', amount: 1 },
    ],
  },
};

export function normalizePromoCode(code) {
  return String(code || '').trim().toUpperCase();
}

export function promoDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isPromoCodeActive(promo, now = new Date()) {
  if (!promo || promo.enabled === false) return false;
  const today = promoDateKey(now);
  return (!promo.startsOn || today >= promo.startsOn) && (!promo.expiresOn || today <= promo.expiresOn);
}

export function resolvePromoCode(code, additionalCodes = []) {
  const normalized = normalizePromoCode(code);
  const dynamic = Array.isArray(additionalCodes) ? additionalCodes.find((promo) => normalizePromoCode(promo?.code) === normalized) : additionalCodes?.[normalized];
  if (!isPromoCodeActive(dynamic)) return null;
  if (Array.isArray(dynamic?.rewards) && dynamic.rewards.length) {
    const itemIds = { small_poison: 'small-poison', medium_poison: 'medium-poison', large_poison: 'large-poison' };
    const rewards = dynamic.rewards.map((reward) => ({
      ...reward,
      ...(itemIds[reward.type] ? { type: 'item', itemId: itemIds[reward.type] } : {}),
      amount: Number(reward.amount),
    }));
    if (rewards.some((reward) => !Number.isFinite(reward.amount) || reward.amount <= 0)) return null;
    return { label: dynamic.label || dynamic.code, rewards, dynamic: true };
  }
  if (dynamic?.field && Number(dynamic.amount) > 0) {
    const fieldTypes = { tentacles: 'tentacles', xp: 'xp', energy: 'energy', premium: 'premium', small_poison: 'item', medium_poison: 'item', large_poison: 'item' };
    const itemIds = { small_poison: 'small-poison', medium_poison: 'medium-poison', large_poison: 'large-poison' };
    const type = fieldTypes[dynamic.field];
    if (!type) return null;
    return {
      label: dynamic.label || `${dynamic.amount} ${dynamic.field}`,
      rewards: [{ type, ...(type === 'item' ? { itemId: itemIds[dynamic.field] } : {}), amount: Number(dynamic.amount) }],
      dynamic: true,
    };
  }
  return null;
}

export function formatPromoRewards(promo) {
  return (promo?.rewards || []).map((reward) => ({
    ...reward,
    labelKey: reward.type,
  }));
}

export function buildPromoUpdates(profile, code, additionalCodes = []) {
  const normalizedCode = normalizePromoCode(code);
  const promo = resolvePromoCode(normalizedCode, additionalCodes);
  if (!promo) {
    return { code: normalizedCode, promo: null, updates: null };
  }

  const usedCodes = profile?.used_promo_codes || [];
  const updates = {
    used_promo_codes: [...usedCodes, normalizedCode],
  };
  if (promo.battlePassTier) {
    updates.battle_pass_tier = promo.battlePassTier;
    updates.battle_pass_view = {
      ...(profile?.battle_pass_view || {}),
      tier: promo.battlePassTier,
      active: true,
    };
  }
  const nextInventory = { ...(profile?.weapon_inventory || {}) };
  const nextItems = Array.isArray(profile?.inventory_items) ? [...profile.inventory_items] : [];
  const nextKeycards = { ...(profile?.keycards || {}) };

  for (const reward of promo.rewards || []) {
    const amount = Number(reward.amount || 0);
    if (!amount) continue;

    if (reward.type === 'tentacles' || reward.type === 'currency') {
      updates.tentacles = Number(updates.tentacles ?? profile?.tentacles ?? 0) + amount;
      continue;
    }

    if (reward.type === 'xp') {
      updates.xp = Number(updates.xp ?? profile?.xp ?? 0) + amount;
      continue;
    }

    if (reward.type === 'energy') {
      updates.energy = Number(updates.energy ?? profile?.energy ?? 0) + amount;
      continue;
    }

    if (reward.type === 'premium') {
      updates.premium = Number(updates.premium ?? profile?.premium ?? 0) + amount;
      continue;
    }

    if (reward.type === 'boss_keys') {
      GAME_CONFIG.BOSSES.forEach((boss) => {
        const location = boss.keycardLocation;
        if (location) nextKeycards[location] = Number(nextKeycards[location] || 0) + amount;
      });
      continue;
    }

    if (reward.type === 'item' && reward.itemId) {
      if (reward.itemId === 'pet5') {
        if (!nextItems.some((item) => item?.id === reward.itemId)) {
          nextItems.push({ id: reward.itemId, type: 'equipment', slot: 'pet' });
        }
      } else {
        nextInventory[reward.itemId] = Number(nextInventory[reward.itemId] || 0) + amount;
      }
    }
  }

  if (Object.keys(nextInventory).length > 0) {
    updates.weapon_inventory = nextInventory;
  }
  if (nextItems.length !== (Array.isArray(profile?.inventory_items) ? profile.inventory_items.length : 0)) {
    updates.inventory_items = nextItems;
  }
  if (Object.keys(nextKeycards).length > 0) {
    updates.keycards = nextKeycards;
  }

  return { code: normalizedCode, promo, updates };
}
