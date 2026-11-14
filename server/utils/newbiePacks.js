export const NEWBIE_PACK_PRODUCTS = [
  { id: 'newbie_pack_i', pack: 1, title: 'Newbie Pack I', stars: 499, usd: 4.99, paymentMethods: ['telegram_stars'] },
  { id: 'newbie_pack_ii', pack: 2, title: 'Newbie Pack II', stars: 999, usd: 9.99, paymentMethods: ['telegram_stars'] },
];

const DURATION_MS = { 1: 48 * 60 * 60 * 1000, 2: 72 * 60 * 60 * 1000 };

export function syncNewbiePackOffers(player, now = Date.now()) {
  if (!player) return null;
  const nowMs = Number(now);
  if (Number(player.level || 0) >= 10 && !player.newbie_pack_1_unlocked_at && !player.newbie_pack_1_purchased_at) {
    player.newbie_pack_1_unlocked_at = new Date(nowMs).toISOString();
    player.newbie_pack_1_expires_at = new Date(nowMs + DURATION_MS[1]).toISOString();
  }
  if (player.newbie_pack_1_purchased_at && !player.newbie_pack_2_unlocked_at && !player.newbie_pack_2_purchased_at) {
    player.newbie_pack_2_unlocked_at = new Date(nowMs).toISOString();
    player.newbie_pack_2_expires_at = new Date(nowMs + DURATION_MS[2]).toISOString();
  }
  return getNewbiePackOffers(player, nowMs);
}

function status(player, pack, now = Date.now()) {
  const prefix = `newbie_pack_${pack}`;
  if (player[`${prefix}_purchased_at`]) return 'purchased';
  const unlockedAt = player[`${prefix}_unlocked_at`];
  const expiresAt = player[`${prefix}_expires_at`];
  if (!unlockedAt || !expiresAt) return 'locked';
  return new Date(expiresAt).getTime() > Number(now) ? 'available' : 'expired';
}

export function getNewbiePackOffers(player, now = Date.now()) {
  return [1, 2].map((pack) => {
    const prefix = `newbie_pack_${pack}`;
    return {
      pack,
      productId: `newbie_pack_${pack === 1 ? 'i' : 'ii'}`,
      status: status(player, pack, now),
      unlockedAt: player?.[`${prefix}_unlocked_at`] || null,
      expiresAt: player?.[`${prefix}_expires_at`] || null,
      purchasedAt: player?.[`${prefix}_purchased_at`] || null,
    };
  });
}

export function assertNewbiePackPurchasable(player, itemId, now = Date.now()) {
  const product = NEWBIE_PACK_PRODUCTS.find((item) => item.id === itemId);
  if (!product) return null;
  syncNewbiePackOffers(player, now);
  const offer = getNewbiePackOffers(player, now).find((entry) => entry.pack === product.pack);
  if (offer?.status !== 'available') {
    const error = new Error(offer?.status === 'expired' ? 'Newbie Pack offer expired' : 'Newbie Pack is not available');
    error.code = offer?.status === 'expired' ? 'NEWBIE_PACK_EXPIRED' : 'NEWBIE_PACK_UNAVAILABLE';
    throw error;
  }
  return product;
}

export function grantNewbiePack(player, itemId, now = Date.now()) {
  const product = assertNewbiePackPurchasable(player, itemId, now);
  if (!product) return false;
  const applied = new Set(player.newbie_pack_reward_transactions || []);
  if (applied.has(itemId)) return false;
  const poison = { ...(player.weapon_inventory || {}) };
  const addPoison = (id, amount) => { poison[id] = Number(poison[id] || 0) + amount; };
  player.premium = Number(player.premium || 0) + (product.pack === 1 ? 150 : 350);
  player.tentacles = Number(player.tentacles || 0) + (product.pack === 1 ? 10000 : 25000);
  player.energy = Number(player.energy || 0) + (product.pack === 1 ? 500 : 1000);
  addPoison('small-poison', product.pack === 1 ? 20 : 40);
  addPoison('medium-poison', product.pack === 1 ? 7 : 15);
  addPoison('large-poison', product.pack === 1 ? 2 : 5);
  player.weapon_inventory = poison;
  player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + (product.pack === 1 ? 5 : 10);
  if (product.pack === 1) {
    const existing = Array.isArray(player.inventory_items) ? player.inventory_items : [];
    if (!existing.some((item) => item?.id === 'pet-cthulhu')) player.inventory_items = [...existing, { id: 'pet-cthulhu', type: 'equipment', slot: 'pet', count: 1, source: 'newbie_pack_i' }];
  } else {
    const existing = Array.isArray(player.inventory_items) ? player.inventory_items : [];
    const gear = ['newbie_pack_ii_boots', 'newbie_pack_ii_legs', 'newbie_pack_ii_hands', 'newbie_pack_ii_armor', 'newbie_pack_ii_head', 'newbie_pack_ii_weapon'];
    const owned = new Set(existing.map((item) => item?.id));
    player.inventory_items = [...existing, ...gear.filter((id) => !owned.has(id)).map((id) => ({ id, type: 'equipment', slot: id.replace('newbie_pack_ii_', ''), count: 1, source: 'newbie_pack_ii' }))];
  }
  const prefix = `newbie_pack_${product.pack}`;
  player[`${prefix}_purchased_at`] = new Date(now).toISOString();
  player.newbie_pack_reward_transactions = [...applied, itemId];
  syncNewbiePackOffers(player, now);
  return true;
}
