import { GAME_CONFIG } from './gameConfig.js';

const POISONS = [
  { id: 'small-poison', title: 'Малий яд', tentacles: 27000, premium: 3 },
  { id: 'medium-poison', title: 'Середній яд', tentacles: 56000, premium: 6 },
  { id: 'large-poison', title: 'Фляга з отрутою', tentacles: 90000, premium: 9 },
];
const ENERGY = [
  { qty: 25, tentacles: 5000, premium: 1 },
  { qty: 50, tentacles: 10000, premium: 2 },
  { qty: 100, tentacles: 20000, premium: 4 },
];
const EQUIPMENT = [
  ...['weapon', 'head', 'armor', 'legs', 'boots', 'hands'].map((slot) => ({ id: `cardboard_${slot}`, slot, setId: 'cardboard_survivor' })),
  ...['weapon', 'head', 'hands', 'legs', 'boots', 'armor'].map((slot) => ({ id: `night_disinfector_${slot}`, slot, setId: 'night_disinfector' })),
  ...['weapon', 'head', 'hands', 'legs', 'boots', 'armor'].map((slot) => ({ id: `nuvelor_${slot}`, slot, setId: 'nuvelor' })),
];

function dailySeed(key) { return Array.from(String(key)).reduce((sum, ch) => ((sum * 31) + ch.charCodeAt(0)) >>> 0, 7); }
function dailyRng(seed) { let value = seed >>> 0; return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function dailyShopOffers(profile, dateKey) {
  const rng = dailyRng(dailySeed(dateKey));
  const kills = profile?.boss_kills_by_id || {};
  const killedBosses = GAME_CONFIG.BOSSES.filter((boss) => Number(kills[boss.id] || 0) > 0);
  const sunday = new Date(`${dateKey}T00:00:00Z`).getUTCDay() === 0;
  const keyBosses = sunday ? GAME_CONFIG.BOSSES.slice(1) : killedBosses.filter((boss) => GAME_CONFIG.BOSSES.indexOf(boss) > 0);
  const setCount = Math.min(3, Math.max(1, killedBosses.length));
  const gear = EQUIPMENT.filter((item) => ['cardboard_survivor', 'night_disinfector', 'nuvelor'].slice(0, setCount).includes(item.setId));
  const pool = [
    ...POISONS.map((item) => {
      const qty = 1 + Math.floor(rng() * 3);
      return { kind: 'poison', ...item, poisonId: item.id, qty, cost: { tentacles: item.tentacles * qty, premium: item.premium * qty } };
    }),
    ...ENERGY.map((item) => ({ kind: 'energy', ...item, cost: { tentacles: item.tentacles, premium: item.premium } })),
    ...(gear.length ? [{ kind: 'equipment', item: gear[Math.floor(rng() * gear.length)], premium: [22, 45, 90][setCount - 1] }] : []),
    ...(keyBosses.length ? [{ kind: 'keycard', boss: keyBosses[Math.floor(rng() * keyBosses.length)], cost: { tentacles: Math.max(18000, (GAME_CONFIG.BOSSES.indexOf(keyBosses[0]) + 1) * 18000) }, paymentCurrency: 'tentacles' }] : []),
  ];
  const result = [];
  while (result.length < 3 && pool.length) {
    const index = Math.floor(rng() * pool.length);
    const offer = pool.splice(index, 1)[0];
    if (offer.kind !== 'equipment' && offer.kind !== 'keycard') offer.paymentCurrency = rng() < 0.5 ? 'tentacles' : 'premium';
    result.push({ ...offer, id: `daily-${dateKey}-${result.length}` });
  }
  return result;
}
