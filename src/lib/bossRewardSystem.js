export const DEFAULT_BOSS_REWARD_CONFIG = {
  rewardScale: 0.5,
  multiplierTiers: [
    { hp: 1000, multiplier: 1 },
    { hp: 10000, multiplier: 1.15 },
    { hp: 100000, multiplier: 1.35 },
    { hp: 1000000, multiplier: 1.7 },
    { hp: 2000000, multiplier: 2 },
    { hp: 10000000, multiplier: 2.5 },
  ],
  randomMultiplier: { min: 0.85, max: 1.15 },
  participation: {
    minDamage: 100,
    maxDamage: 1000,
    hpRatio: 0.001,
    rewards: { tentacles: 100, xp: 10, strength: 0, energy: 0, premium: 0 },
  },
  damagePer1000: { tentacles: 5000, xp: 50, strength: 10, energy: 20, premium: 0 },
  cashbackTiers: [
    { maxHp: 1000, min: 0.1, max: 0.15 },
    { maxHp: 10000, min: 0.15, max: 0.2 },
    { maxHp: 2000000, min: 0.15, max: 0.25 },
    { maxHp: null, min: 0.25, max: 0.3 },
  ],
  keyDrop: { baseChance: 0.2, pityStep: 0.02, maxChance: 1 },
  rankMultipliers: [
    { maxRank: 1, multiplier: 1.5 },
    { maxRank: 3, multiplier: 1.35 },
    { maxRank: 10, multiplier: 1.25 },
    { maxRank: 25, multiplier: 1.15 },
    { maxRank: 50, multiplier: 1.1 },
    { maxRank: 100, multiplier: 1.05 },
  ],
  specialDrop: {
    baseChance: { gear: 0.03, pet: 0.0065, background: 0.0045 },
    rankBonus: { rank1: 0.01, top10: 0.005, top100: 0.0025 },
    maxChance: 0.07,
  },
  backgroundChanceByBoss: {
    heli: 0.0045,
    tank: 0.0045,
    chinook: 0.0045,
    boss4: 0.0045,
    boss5: 0.0045,
    boss6: 0.0045,
  },
  boxIconShareThresholds: [0.001, 0.01, 0.05, 0.1],
};

const RESOURCE_KEYS = ['tentacles', 'xp', 'strength', 'energy', 'premium'];

export function stripRetiredBossFragments(drops = []) {
  return drops.filter((drop) => !drop?.keyFragment && !['gear_fragment', 'boss_gear_fragment', 'boss_key_fragment'].includes(drop?.type));
}

export function sanitizeBossRewardConfig(value = {}) {
  const merge = (defaults, incoming) => {
    if (Array.isArray(defaults)) {
      const source = Array.isArray(incoming) && incoming.length ? incoming : defaults;
      return source.map((item, index) => merge(defaults[index] ?? defaults.at(-1), item));
    }
    if (defaults && typeof defaults === 'object') {
      return Object.fromEntries(Object.entries(defaults).map(([key, item]) => [key, merge(item, incoming?.[key])]));
    }
    if (defaults === null) {
      if (incoming === null) return null;
      const number = Number(incoming);
      return Number.isFinite(number) && number >= 0 ? number : null;
    }
    if (typeof defaults === 'number') {
      const number = Number(incoming);
      return Number.isFinite(number) && number >= 0 ? number : defaults;
    }
    return typeof incoming === typeof defaults ? incoming : defaults;
  };
  const config = merge(DEFAULT_BOSS_REWARD_CONFIG, value);
  config.multiplierTiers.sort((a, b) => a.hp - b.hp);
  config.cashbackTiers.sort((a, b) => (a.maxHp ?? Infinity) - (b.maxHp ?? Infinity));
  config.rankMultipliers.sort((a, b) => a.maxRank - b.maxRank);
  config.randomMultiplier.max = Math.max(config.randomMultiplier.min, config.randomMultiplier.max);
  config.participation.maxDamage = Math.max(config.participation.minDamage, config.participation.maxDamage);
  config.specialDrop.maxChance = Math.min(1, config.specialDrop.maxChance);
  for (const bossId of Object.keys(config.backgroundChanceByBoss || {})) {
    config.backgroundChanceByBoss[bossId] = Math.min(1, config.backgroundChanceByBoss[bossId]);
  }
  config.keyDrop.maxChance = Math.min(1, config.keyDrop.maxChance);
  config.keyDrop.baseChance = Math.min(config.keyDrop.maxChance, config.keyDrop.baseChance);
  return config;
}

export function getBossMultiplier(maxHp, config = DEFAULT_BOSS_REWARD_CONFIG) {
  const hp = Math.max(1, Number(maxHp) || 1);
  const tiers = [...(config.multiplierTiers || DEFAULT_BOSS_REWARD_CONFIG.multiplierTiers)].sort((a, b) => a.hp - b.hp);
  if (hp <= tiers[0].hp) return tiers[0].multiplier;
  for (let index = 1; index < tiers.length; index += 1) {
    const upper = tiers[index];
    const lower = tiers[index - 1];
    if (hp <= upper.hp) {
      const progress = (hp - lower.hp) / (upper.hp - lower.hp);
      return lower.multiplier + (upper.multiplier - lower.multiplier) * progress;
    }
  }
  return tiers.at(-1)?.multiplier || 1;
}

export function getBossParticipationThreshold(maxHp, config = DEFAULT_BOSS_REWARD_CONFIG) {
  const hp = Math.max(1, Number(maxHp) || 1);
  const { minDamage, maxDamage, hpRatio } = config.participation;
  return Math.max(minDamage, Math.min(maxDamage, hp * hpRatio));
}

export function calculateActualPoisonRefundUnits({ actualDamage, poisonDamage, plannedPoisonDamage, consumedUses, attackCount = 1 } = {}) {
  const actual = Math.max(0, Number(actualDamage) || 0);
  const actualPoisonDamage = Math.min(actual, Math.max(0, Number(poisonDamage) || 0));
  const plannedPerUse = Math.max(1, Number(plannedPoisonDamage) || 0);
  const units = Math.min(
    Math.max(0, Number(consumedUses) || 0),
    (actualPoisonDamage / plannedPerUse) * Math.max(1, Number(attackCount) || 1),
  );
  return { actualPoisonDamage, refundUnits: units };
}

export function getBossKeyDropChance(pityStacks = 0, config = DEFAULT_BOSS_REWARD_CONFIG) {
  const settings = config.keyDrop || DEFAULT_BOSS_REWARD_CONFIG.keyDrop;
  return Math.min(settings.maxChance, settings.baseChance + Math.max(0, Number(pityStacks) || 0) * settings.pityStep) * config.rewardScale;
}

export function getBossRankMultiplier(rank, config = DEFAULT_BOSS_REWARD_CONFIG) {
  const numericRank = Math.max(1, Math.floor(Number(rank) || 1));
  return config.rankMultipliers.find((entry) => numericRank <= entry.maxRank)?.multiplier || 1;
}

export function getBossDamageBoxIcon(damage, maxHp, config = DEFAULT_BOSS_REWARD_CONFIG) {
  const share = Math.max(0, Number(damage) || 0) / Math.max(1, Number(maxHp) || 1);
  const [bronze, silver, gold, epic] = config.boxIconShareThresholds;
  if (share <= bronze) return 'damage_box_1';
  if (share <= silver) return 'damage_box_2';
  if (share <= gold) return 'damage_box_3';
  if (share <= epic) return 'damage_box_4';
  return 'damage_box_5';
}

function rankSpecialBonus(rank, config) {
  if (rank === 1) return config.specialDrop.rankBonus.rank1;
  if (rank <= 10) return config.specialDrop.rankBonus.top10;
  if (rank <= 100) return config.specialDrop.rankBonus.top100;
  return 0;
}

function addWholeWithCarry(key, amount, carries, drops, type = key) {
  const total = Math.max(0, Number(amount) || 0) + Math.max(0, Number(carries[key]) || 0);
  const whole = Math.floor(total + 1e-9);
  carries[key] = Number((total - whole).toFixed(9));
  if (whole > 0) drops.push({ type, name: type === 'strength' ? 'CA' : undefined, qty: whole });
}

function selectSpecialDrop({ rank, config, availableSpecials, rng, bossId, drops }) {
  const getWeight = (type) => type === 'background'
    ? config.backgroundChanceByBoss?.[bossId] ?? config.specialDrop.baseChance[type]
    : config.specialDrop.baseChance[type];
  const choices = availableSpecials
    .filter((type) => Number(getWeight(type)) > 0)
    .map((type) => ({ type, weight: Number(getWeight(type)) || 0 }));
  const baseChance = choices.reduce((sum, choice) => sum + choice.weight, 0);
  if (!choices.length || baseChance <= 0) return 0;
  const totalChance = Math.min(config.specialDrop.maxChance, baseChance + rankSpecialBonus(rank, config));
  if (rng() >= totalChance) return totalChance;
  let roll = rng() * baseChance;
  const selected = choices.find((choice) => (roll -= choice.weight) < 0)?.type || choices.at(-1).type;
  const dropType = { gear: 'boss_gear_piece', pet: 'boss_pet', background: 'boss_background' }[selected];
  drops.push({ type: dropType, name: selected === 'gear' ? 'Boss equipment' : selected === 'pet' ? 'Boss pet' : 'Boss background', qty: 1, bossId });
  return totalChance;
}

export function calculateBossReward({
  bossId,
  maxHp,
  actualDamageTotal,
  poisonRefundUnits = {},
  rank = 101,
  availableSpecials = ['gear', 'pet', 'background'],
  firstKillDrops = [],
  pityDrops = [],
  carries = {},
  rng = Math.random,
  config: rawConfig,
} = {}) {
  const config = sanitizeBossRewardConfig(rawConfig || DEFAULT_BOSS_REWARD_CONFIG);
  const hp = Math.max(1, Number(maxHp) || 1);
  const damage = Math.min(hp, Math.max(0, Number(actualDamageTotal) || 0));
  const threshold = getBossParticipationThreshold(hp, config);
  const participationEligible = damage >= threshold;
  const bossMultiplier = getBossMultiplier(hp, config);
  const rankMultiplier = getBossRankMultiplier(rank, config);
  const randomMultiplier = config.randomMultiplier.min + rng() * (config.randomMultiplier.max - config.randomMultiplier.min);
  const nextCarries = {
    resources: { ...(carries.resources || {}) },
    poison: { ...(carries.poison || {}) },
  };
  const drops = [];

  if (participationEligible) {
    const damageUnits = damage / 1000;
    for (const key of RESOURCE_KEYS) {
      const participation = Number(config.participation.rewards[key] || 0) * bossMultiplier;
      const variable = damageUnits * Number(config.damagePer1000[key] || 0) * bossMultiplier * randomMultiplier * rankMultiplier;
      addWholeWithCarry(key, (participation + variable) * config.rewardScale, nextCarries.resources, drops);
    }

    const cashbackTier = config.cashbackTiers.find((tier) => tier.maxHp === null || hp <= tier.maxHp)
      || config.cashbackTiers.at(-1);
    const cashbackRate = cashbackTier.min + rng() * (cashbackTier.max - cashbackTier.min);
    const poisonKeys = { small: 'satchel', medium: 'f4', large: 'c4' };
    for (const [type, weaponId] of Object.entries(poisonKeys)) {
      const refund = Math.max(0, Number(poisonRefundUnits[type]) || 0) * cashbackRate;
      const total = refund + Math.max(0, Number(nextCarries.poison[type]) || 0);
      const whole = Math.floor(total + 1e-9);
      nextCarries.poison[type] = Number((total - whole).toFixed(9));
      if (whole > 0) drops.push({ type: 'weapon', id: weaponId, name: `${type} poison`, qty: whole });
    }

    // The next boss key is granted only by the separate per-boss pity roll.
  }

  const specialChance = participationEligible
    ? selectSpecialDrop({ rank, config, availableSpecials, rng, bossId, drops })
    : 0;
  const hasAnyReward = participationEligible || firstKillDrops.length > 0 || pityDrops.length > 0;
  if (hasAnyReward) {
    drops.push(...firstKillDrops.map((drop) => {
      if (!RESOURCE_KEYS.includes(drop?.type)) return drop;
      return { ...drop, qty: Math.floor(Math.max(0, Number(drop.qty) || 0) * config.rewardScale) };
    }).filter((drop) => Number(drop?.qty) > 0), ...pityDrops);
  }

  return {
    eligible: hasAnyReward,
    participationEligible,
    participationThreshold: threshold,
    actualDamageTotal: damage,
    damageShare: damage / hp,
    bossMultiplier,
    randomMultiplier,
    rank,
    rankMultiplier,
    rankFrame: rank === 1 ? 'unique' : rank <= 10 ? 'gold' : rank <= 100 ? 'rank' : null,
    specialChance,
    boxType: getBossDamageBoxIcon(damage, hp, config),
    drops,
    carries: nextCarries,
  };
}
