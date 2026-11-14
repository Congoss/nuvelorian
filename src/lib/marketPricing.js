// Starting market prices and tradability. Shared by the market server, AI
// market players and the market UI. Prices are anchored in USD and converted
// to PL4 at the live quote, so a PL4 price move does not reprice gear in dollars.
// Method and assumptions: docs/MARKET_ECONOMY.md.
import {EQUIPMENT_SET_BALANCE} from './equipmentBalance.js';

// USD per point of set power (EQUIPMENT_SET_BALANCE.hit). Anchor: the bound
// Legendary Battle Pass set (power 40) for $6.99 including many other rewards.
export const USD_PER_POWER = 0.025;
export const FALLBACK_PL4_USD = 0.0000077; // nearly.trade quote, 2026-11-11
export const MAX_PRICE_HUNDREDTHS = 100_000_000_000; // 1B PL4 = total supply
const SLOTS = ['weapon','head','armor','hands','legs','boots'];

// Boss sets that drop as tradable gear. tier reflects the boss level gate.
// Only key-gated bosses: every fight costs a keycard, so drops cannot be farmed
// on cooldown. The first boss (heli) needs no key and dies in one hit, so its
// cardboard set and pet-bot stay bound (NON_TRADABLE_BOSS_DROPS).
export const NON_TRADABLE_BOSS_DROPS = {sets:['cardboard'], pets:['pet-bot'], reason:'first boss: no keycard, guaranteed set'};
export const TRADABLE_SETS = {
  night_disinfector: {boss:'tank', tier:1},
  nuvelor: {boss:'chinook', tier:1},
  set4: {boss:'boss4', tier:1},
  set5: {boss:'boss6', tier:1.2},
  anubis: {boss:'boss7', tier:1.4},
  shkraban: {boss:'boss8', tier:1.6},
};
// Slot weight: legs carry poison damage (most valuable to payers), head boss damage.
export const SLOT_WEIGHT = {legs:1.3, head:1.15, weapon:1, armor:1, hands:0.85, boots:0.85};

// Boss pets: large-poison bonus × tier × 2 (pets drop 4.6× rarer than gear).
export const TRADABLE_PETS = {
  'pet-skunk': {boss:'chinook', usd:0.50, note:'No combat bonus; cosmetic'},
  pet5: {boss:'boss4', usd:4.00},
  'pet-purrgulp': {boss:'boss7', usd:14.00},
  'pet-toaster': {boss:'boss8', usd:24.00},
};

const prefixOf = id => Object.keys(TRADABLE_SETS).find(prefix => String(id).startsWith(prefix + '_') && SLOTS.includes(String(id).slice(prefix.length + 1)));
const boundSource = item => ['nft_holder','starter','battle_pass','battlepass','event','pack','gift','shop','reward_mail'].includes(String(item?.sourceType || '').toLowerCase());

// Only boss drops trade. Starter, NFT, Battle Pass, event, pack and gifted items stay bound.
// marketBound: a drop past the boss's daily curve after its gold medal (server/app.js withMarketBinding).
export function isTradableItem(player, item) {
  if (!item || item.type !== 'equipment') return false;
  if (item.starterEquipment || item.marketBound || boundSource(item) || item.nonTransferable || item.bound || item.soulbound) return false;
  if (player?.holder_pet_grants?.[item.id]) return false;
  return Boolean(prefixOf(item.id) || TRADABLE_PETS[item.id]);
}

// Scrap to the NPC for tentacles: every boss drop, including the first boss's set
// and bound farmed drops. Never NFT, Battle Pass, event, pack or gifted items.
const SCRAP_ONLY_PREFIXES = NON_TRADABLE_BOSS_DROPS.sets;
export function isScrappableItem(player, item) {
  if (!item || item.type !== 'equipment') return false;
  if (boundSource(item) || item.nonTransferable || item.soulbound || player?.holder_pet_grants?.[item.id]) return false;
  const id = String(item.id);
  const scrapOnly = SCRAP_ONLY_PREFIXES.some(prefix => id.startsWith(prefix + '_') && SLOTS.includes(id.slice(prefix.length + 1))) || NON_TRADABLE_BOSS_DROPS.pets.includes(id);
  return scrapOnly || Boolean(prefixOf(id) || TRADABLE_PETS[id]);
}

// Expected gums per level step (a failed normal/improved attempt drops one level).
function stepCosts(chances) {
  const out = [];
  chances.forEach((chance, level) => { const p = chance / 100; out.push(1 / p + (1 - p) / p * (out[level - 1] || 0)); });
  return out;
}
export const NORMAL_GUM_STEPS = stepCosts([90,85,80,75,70,65,60,55,50,45,40,35,30,25,20]);
export const IMPROVED_GUM_STEPS = stepCosts([95,92,89,86,83,80,75,70,65,60,55,50,45,40,30]);
export const GUM_USD = {normal:0.10, improved:0.25, premium:0.99};
export const ENHANCEMENT_RESALE = 0.8;

// Cheapest expected route to each level, discounted for resale.
export function enhancementUsd(level) {
  let total = 0;
  for (let l = 0; l < Math.max(0, Math.min(15, Math.floor(Number(level) || 0))); l++)
    total += Math.min(GUM_USD.premium, NORMAL_GUM_STEPS[l] * GUM_USD.normal, IMPROVED_GUM_STEPS[l] * GUM_USD.improved);
  return total * ENHANCEMENT_RESALE;
}

export function baseUsd(id) {
  if (TRADABLE_PETS[id]) return TRADABLE_PETS[id].usd;
  const prefix = prefixOf(id);
  if (!prefix) return null;
  const set = TRADABLE_SETS[prefix];
  const power = Number(Object.values(EQUIPMENT_SET_BALANCE).find(s => s.prefix === prefix)?.hit) || 0;
  return power * USD_PER_POWER * set.tier * SLOT_WEIGHT[String(id).slice(prefix.length + 1)];
}

export function startingPriceUsd(item) {
  const base = baseUsd(item?.id);
  return base === null ? null : base + (TRADABLE_PETS[item.id] ? 0 : enhancementUsd(item.enhancementLevel));
}

export const usdToHundredths = (usd, pl4Usd = FALLBACK_PL4_USD) =>
  Math.max(0, Math.min(MAX_PRICE_HUNDREDTHS, Math.round(usd / (pl4Usd > 0 ? pl4Usd : FALLBACK_PL4_USD) * 100)));

export function priceList() {
  const rows = [];
  for (const prefix of Object.keys(TRADABLE_SETS)) for (const slot of SLOTS) rows.push({id:`${prefix}_${slot}`, kind:'gear', boss:TRADABLE_SETS[prefix].boss, usd:baseUsd(`${prefix}_${slot}`)});
  for (const [id, pet] of Object.entries(TRADABLE_PETS)) rows.push({id, kind:'pet', boss:pet.boss, usd:pet.usd});
  return rows;
}
