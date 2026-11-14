export const SHOP_PAYMENT_METHODS = [
  {
    id: 'ton',
    label: 'TON',
    title: 'TON',
  },
  {
    id: 'near',
    label: 'NEAR',
    title: 'NEAR',
  },
  {
    id: 'telegram_stars',
    label: 'STARS',
    title: 'STARS',
  },
];

export const GEM_SHOP_PACKS = [
  {
    id: 'gems_50',
    title: '35 T-Pape',
    cdm: 35,
    usd: 1.99,
    stars: 199,
    assetKey: 'pack-1',
    badge: null,
    savings: null,
    paymentMethods: ['ton', 'near', 'telegram_stars'],
  },
  {
    id: 'gems_120',
    title: '120 T-Pape',
    cdm: 120,
    usd: 4.99,
    stars: 499,
    badge: null,
    savings: '+37%',
    assetKey: 'pack-2',
    badge: null,
    paymentMethods: ['ton', 'near', 'telegram_stars'],
  },
  {
    id: 'gems_300',
    title: '300 T-Pape',
    cdm: 300,
    usd: 9.99,
    stars: 999,
    badge: null,
    savings: '+71%',
    assetKey: 'pack-3',
    badge: null,
    paymentMethods: ['ton', 'near', 'telegram_stars'],
  },
  {
    id: 'gems_700',
    title: '700 T-Pape',
    cdm: 700,
    usd: 19.99,
    stars: 1999,
    badge: 'TOP SELLER',
    savings: '+99%',
    assetKey: 'pack-4',
    badge: null,
    paymentMethods: ['ton', 'near', 'telegram_stars'],
  },
  {
    id: 'gems_1500',
    title: '1500 T-Pape',
    cdm: 1800,
    usd: 49.99,
    stars: 4999,
    badge: null,
    savings: '+105%',
    assetKey: 'pack-5',
    badge: null,
    paymentMethods: ['ton', 'near', 'telegram_stars'],
  },
  {
    id: 'gems_3500',
    title: '3500 T-Pape',
    cdm: 3500,
    usd: 89.99,
    stars: 8999,
    assetKey: 'pack-6',
    badge: 'BEST VALUE',
    savings: '+121%',
    paymentMethods: ['ton', 'near', 'telegram_stars'],
  },
];

export const BATTLE_PASS_PACKS = [
  { id: 'battle_pass_epic', title: 'Battle Pass Epic', tier: 'epic', stars: 299, usd: 2.99, paymentMethods: ['telegram_stars', 'near'] },
  { id: 'battle_pass_legendary', title: 'Battle Pass Legendary', tier: 'legendary', stars: 699, usd: 6.99, paymentMethods: ['telegram_stars', 'near'] },
];

export const NEWBIE_PACKS = [
  { id: 'newbie_pack_i', title: 'Newbie Pack I', stars: 499, usd: 4.99, paymentMethods: ['telegram_stars', 'near'] },
  { id: 'newbie_pack_ii', title: 'Newbie Pack II', stars: 999, usd: 9.99, paymentMethods: ['telegram_stars', 'near'] },
];

export const PAID_CONSUMABLE_PACKS = [
  { id: 'paid_poison_small', title: 'Small Poison ×1', usd: 0.09, stars: 9, poisonId: 'small-poison', amount: 1, paymentMethods: ['near', 'telegram_stars'] },
  { id: 'paid_poison_medium', title: 'Medium Poison ×1', usd: 0.19, stars: 19, poisonId: 'medium-poison', amount: 1, paymentMethods: ['near', 'telegram_stars'] },
  { id: 'paid_poison_large', title: 'Large Poison ×1', usd: 0.39, stars: 39, poisonId: 'large-poison', amount: 1, paymentMethods: ['near', 'telegram_stars'] },
];

const PAID_POISON_BY_TYPE = {
  small: PAID_CONSUMABLE_PACKS[0],
  medium: PAID_CONSUMABLE_PACKS[1],
  large: PAID_CONSUMABLE_PACKS[2],
};

export function getPaidPoisonPack(poisonId, value) {
  const amount = Number(value);
  const base = Object.values(PAID_POISON_BY_TYPE).find((item) => item.poisonId === poisonId);
  if (!base || !Number.isInteger(amount) || amount < 1 || amount > 100) return null;
  if (amount === 1) return base;
  return {
    ...base,
    id: `${base.id}_${amount}`,
    title: `${base.title.replace(/ ×1$/, '')} ×${amount}`,
    usd: Number((base.usd * amount).toFixed(2)),
    stars: base.stars * amount,
    amount,
  };
}

export function getPaidEnergyPack(value) {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount < 2 || amount > 1000 || amount % 2 !== 0) return null;
  const stars = Math.ceil(amount * 0.49);
  return {
    id: `paid_energy_${amount}`,
    title: `Energy +${amount}`,
    usd: Number((stars / 100).toFixed(2)),
    stars,
    energy: amount,
    paymentMethods: ['near', 'telegram_stars'],
  };
}

export function getShopPaymentProduct(itemId, catalog = getShopCatalog()) {
  const energyMatch = String(itemId || '').match(/^paid_energy_(\d{1,4})$/);
  if (energyMatch) return getPaidEnergyPack(Number(energyMatch[1]));
  const poisonMatch = String(itemId || '').match(/^paid_poison_(small|medium|large)_(\d{1,3})$/);
  if (poisonMatch) return getPaidPoisonPack(PAID_POISON_BY_TYPE[poisonMatch[1]]?.poisonId, Number(poisonMatch[2]));
  const packs = [
    ...(catalog.gemPacks || []),
    ...(catalog.battlePassPacks || []),
    ...(catalog.newbiePacks || []),
    ...(catalog.paidConsumablePacks || []),
  ];
  return packs.find((item) => String(item?.id || '') === String(itemId || '')) || null;
}

export function getShopCatalog() {
  return {
    version: '2026-06-15',
    paymentMethods: SHOP_PAYMENT_METHODS,
    gemPacks: GEM_SHOP_PACKS,
    battlePassPacks: BATTLE_PASS_PACKS,
    newbiePacks: NEWBIE_PACKS,
    paidConsumablePacks: PAID_CONSUMABLE_PACKS,
  };
}
