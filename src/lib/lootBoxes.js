import { GAME_CONFIG } from './gameConfig.js';

import { getBossDamageBoxIcon as getConfiguredBossDamageBoxIcon } from './bossRewardSystem.js';

export const FIRST_BOSS_HERO_BACKGROUND_ID = 'boss-fight';

// Add a boss here whenever it receives a dedicated fight background.
// The same id is registered in CAMP_BACKGROUNDS for the hero-room picker.
export const BOSS_BACKGROUND_REWARDS = {
  heli: { backgroundId: 'boss-fight', name: 'Сцена бою з Недоважком', dropChance: 0.01 },
  tank: { backgroundId: 'boss-2-fight', name: 'Сцена бою з Міллю', dropChance: 0.01 },
  chinook: { backgroundId: 'boss-3-fight', name: 'Сцена бою з Шорком', dropChance: 0.01 },
  boss4: { backgroundId: 'boss-4-fight', name: 'Сцена бою з Глистою', dropChance: 0.01 },
  boss5: { backgroundId: 'boss-5-fight', name: 'Сцена бою зі Спорголом', dropChance: 0.01 },
  boss6: { backgroundId: 'boss-6-fight', name: 'Сцена бою із Засмоктом', dropChance: 0.01 },
};

const WEAPON_TIERS = [
  { id: 'satchel', name: 'Заточка', icon: 'knife', tier: 1, weight: 65 },
  { id: 'f1', name: 'F1 Grenade', icon: 'grenade', tier: 2, weight: 30 },
  { id: 'c4', name: 'C4', icon: 'c4', tier: 3, weight: 5 },
];

const COUNT_WEIGHTS = [
  { count: 3, weight: 10 },
  { count: 4, weight: 15 },
  { count: 5, weight: 20 },
  { count: 6, weight: 20 },
  { count: 7, weight: 15 },
  { count: 8, weight: 10 },
  { count: 9, weight: 7 },
  { count: 10, weight: 3 },
];

export const BOX_TYPES = {
  standard_boss: { id: 'standard_boss', name: 'Standard Boss Box', icon: 'box', color: '#8f9b6d', rarity: 'common' },
  damage_box_1: { id: 'damage_box_1', name: 'Damage Box I', icon: 'i', color: '#6b7280', rarity: 'common' },
  damage_box_2: { id: 'damage_box_2', name: 'Damage Box II', icon: 'ii', color: '#3b82f6', rarity: 'rare' },
  damage_box_3: { id: 'damage_box_3', name: 'Damage Box III', icon: 'iii', color: '#8b5cf6', rarity: 'epic' },
  damage_box_4: { id: 'damage_box_4', name: 'Damage Box IV', icon: 'iv', color: '#f59e0b', rarity: 'epic' },
  damage_box_5: { id: 'damage_box_5', name: 'Damage Box V', icon: 'v', color: '#ef4444', rarity: 'legendary' },
  top_small: { id: 'top_small', name: 'Small Top Box', icon: 'small', color: '#7dd3fc', rarity: 'rare' },
  top_bronze: { id: 'top_bronze', name: 'Bronze Top Box', icon: 'bronze', color: '#cd7f32', rarity: 'rare' },
  top_silver: { id: 'top_silver', name: 'Silver Top Box', icon: 'silver', color: '#c0c0c0', rarity: 'epic' },
  top_gold: { id: 'top_gold', name: 'Gold Top Box', icon: 'gold', color: '#f59e0b', rarity: 'legendary' },
  boss_top1: { id: 'boss_top1', name: 'Top 1 Box', icon: 't1', color: '#f59e0b', rarity: 'legendary' },
  boss_top10: { id: 'boss_top10', name: 'Top 2-10 Box', icon: 't10', color: '#a855f7', rarity: 'epic' },
  boss_top100: { id: 'boss_top100', name: 'Top 10-100 Box', icon: 't100', color: '#3b82f6', rarity: 'rare' },
  boss_damage_pack: { id: 'boss_damage_pack', name: 'Boss Damage Pack', icon: 'pack', color: '#3b82f6', rarity: 'rare' },
  poison_pack: { id: 'poison_pack', name: 'Poison Pack', icon: 'pack', color: '#22c55e', rarity: 'rare' },
  weekly_progress_pack: { id: 'weekly_progress_pack', name: 'Weekly Progress Pack', icon: 'pack', color: '#f59e0b', rarity: 'legendary' },
  starter_offer: { id: 'starter_offer', name: 'Starter Offer', icon: 'offer', color: '#cd7f32', rarity: 'rare' },
  first_boss_offer: { id: 'first_boss_offer', name: 'First Boss Offer', icon: 'offer', color: '#c0c0c0', rarity: 'epic' },
  weekly_offer: { id: 'weekly_offer', name: 'Weekly Offer', icon: 'offer', color: '#f59e0b', rarity: 'legendary' },
  invite_box: { id: 'invite_box', name: 'Invite Box', icon: 'invite', color: '#8f9b6d', rarity: 'common' },
  big_invite_box: { id: 'big_invite_box', name: 'Big Invite Box', icon: 'invite', color: '#22c55e', rarity: 'uncommon' },
  rare_invite_box: { id: 'rare_invite_box', name: 'Rare Invite Box', icon: 'invite', color: '#3b82f6', rarity: 'rare' },
  epic_invite_box: { id: 'epic_invite_box', name: 'Epic Invite Box', icon: 'invite', color: '#ef4444', rarity: 'epic' },
  boss_part: { id: 'boss_part', name: 'Participant Box', icon: 'part', color: '#6b7280', rarity: 'common' },
  collection: { id: 'collection', name: 'Collection Box', icon: 'collection', color: '#8b5cf6', rarity: 'epic' },
  weapon: { id: 'weapon', name: 'Weapon Box', icon: 'weapon', color: '#ef4444', rarity: 'rare' },
  resource: { id: 'resource', name: 'Resource Box', icon: 'resource', color: '#f59e0b', rarity: 'common' },
  activity: { id: 'activity', name: 'Activity Box', icon: 'activity', color: '#22d3ee', rarity: 'uncommon' },
};

function weightedRandom(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }

  return items[items.length - 1];
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function rollRange(range) {
  return Array.isArray(range) ? randInt(range[0], range[1]) : range;
}

function makeDrop(type, name, qty, extra = {}) {
  return { type, name, qty, ...extra };
}

function pushGuaranteed(drops, rows) {
  rows.forEach((row) => drops.push(makeDrop(row.type, row.name, rollRange(row.qty), row.extra || {})));
}

function rollWeightedDrop(table) {
  const row = weightedRandom(table);
  if (row.type === 'nothing') return null;
  return makeDrop(row.type, row.name, rollRange(row.qty), row.extra || {});
}

function pushBonusRolls(drops, table, rolls) {
  for (let i = 0; i < rolls; i += 1) {
    const drop = rollWeightedDrop(table);
    if (drop) drops.push(drop);
  }
}

function rollChanceDrops(rows = []) {
  return rows
    .filter((row) => Math.random() < row.chance)
    .map((row) => makeDrop(row.type, row.name, row.qty || 1, row.extra || {}));
}

function rollWeapon() {
  return weightedRandom(WEAPON_TIERS);
}

function rollSetItem() {
  const locationKeys = Object.keys(GAME_CONFIG.COLLECTIONS);
  const location = locationKeys[Math.floor(Math.random() * locationKeys.length)];
  const items = GAME_CONFIG.COLLECTIONS[location];
  const item = items[Math.floor(Math.random() * items.length)];
  return { type: 'collection_item', ...item, qty: 1 };
}

function rollByTable(table, tentaclesAmt, xpAmt) {
  const roll = Math.random();
  let acc = 0;
  acc += table.tentacles;
  if (roll < acc) return { type: 'tentacles', name: 'tentacles', qty: tentaclesAmt };
  acc += table.xp;
  if (roll < acc) return { type: 'xp', name: 'XP', qty: xpAmt };
  acc += table.weapon;
  if (roll < acc) return { type: 'weapon', ...rollWeapon(), qty: 1 };
  if (table.setItem) return rollSetItem();
  return { type: 'tentacles', name: 'tentacles', qty: tentaclesAmt };
}

function getBossRewardMultiplier(bossId) {
  const bossIndex = GAME_CONFIG.BOSSES.findIndex((boss) => boss.id === bossId);
  if (bossIndex === -1) return 1;

  const multipliers = [1, 1.45, 2.1, 2.8, 3.8, 5.1, 6.4, 8];
  return multipliers[bossIndex] || (multipliers[multipliers.length - 1] + (bossIndex - multipliers.length + 1) * 1.25);
}

function scaleBossDrop(drop, multiplier) {
  if (!drop) return drop;
  if (['equipment', 'keycard', 'boss_gear_piece', 'boss_pet', 'boss_background'].includes(drop.type)) return drop;

  const scalableTypes = new Set(['tentacles', 'xp', 'strength', 'energy', 'premium', 'poison']);
  if (!scalableTypes.has(drop.type)) return drop;
  const bossDropNerf = 0.15;
  const firstBossId = GAME_CONFIG.BOSSES[0]?.id;
  const firstBossXpBoost = drop.type === 'xp' && drop.bossId === firstBossId ? 0.2 : 1;

  const currentQty = Math.max(1, Math.round((drop.qty || 1) * multiplier * bossDropNerf * firstBossXpBoost));
  const halfQty = currentQty * 0.5;
  const qty = Math.floor(halfQty) + (Math.random() < halfQty % 1 ? 1 : 0);
  if (qty <= 0) return null;
  return {
    ...drop,
    qty,
  };
}

export function openBox(boxType, bossId, tableOverrides = null) {
  const drops = [];
  const bossTable = tableOverrides?.[boxType] || BOSS_BOX_TABLES[boxType];

  if (bossTable) {
    const bossIndex = GAME_CONFIG.BOSSES.findIndex((boss) => boss.id === bossId);
    const nextKeyLocation = GAME_CONFIG.BOSSES[bossIndex + 1]?.keycardLocation || null;
    const rewardMultiplier = getBossRewardMultiplier(bossId);
    const backgroundReward = BOSS_BACKGROUND_REWARDS[bossId];
    const guaranteedRows = Array.isArray(bossTable.guaranteed) ? bossTable.guaranteed : [];
    const configuredBonusRows = Array.isArray(bossTable.bonus) ? bossTable.bonus : [];
    const extraChanceRows = Array.isArray(bossTable.extraChanceDrops) ? bossTable.extraChanceDrops : [];
    const bonusRolls = configuredBonusRows.length
      ? Math.max(0, Math.min(100, Math.floor(Number(bossTable.rolls) || 0)))
      : 0;
    const hasBackgroundSlot = configuredBonusRows.some((row) => row.type === 'boss_background');
    const bonusRows = configuredBonusRows.filter((row) => row.type !== 'boss_background');

    pushGuaranteed(drops, guaranteedRows);
    pushBonusRolls(drops, bonusRows, bonusRolls);
    if (hasBackgroundSlot && backgroundReward && Math.random() < backgroundReward.dropChance) {
      drops.push(makeDrop('boss_background', backgroundReward.name, 1));
    }

    return drops
      .concat(rollChanceDrops(extraChanceRows))
      .map((drop) => {
        if (drop.type === 'boss_background' && !BOSS_BACKGROUND_REWARDS[bossId]) return null;

        if (drop.type === 'keycard') {
          if (!nextKeyLocation) return null;
          return { ...drop, location: nextKeyLocation, name: drop.name || 'Boss Key' };
        }

        return {
          ...drop,
          bossId: ['boss_gear_piece', 'boss_pet', 'boss_background'].includes(drop.type) ? bossId : drop.bossId,
        };
      })
      .map((drop) => scaleBossDrop(drop, rewardMultiplier))
      .filter(Boolean);
  }

  if (boxType === 'weapon') {
    const count = weightedRandom(COUNT_WEIGHTS).count;
    const weapons = [];
    let hasTierTwo = false;

    for (let i = 0; i < count; i += 1) {
      const weapon = rollWeapon();
      if (weapon.tier >= 2) hasTierTwo = true;
      weapons.push(weapon);
    }

    if (!hasTierTwo) weapons[0] = { ...WEAPON_TIERS[1] };
    return weapons.map((weapon) => ({ type: 'weapon', ...weapon, qty: 1 }));
  }

  if (boxType === 'resource') {
    return [
      { type: 'tentacles', name: 'tentacles', qty: 500 },
      { type: 'xp', name: 'XP', qty: 200 },
    ];
  }

  if (boxType === 'collection') {
    return [rollByTable({ tentacles: 0.4, xp: 0.25, weapon: 0.2, setItem: 0.15 }, 300, 200)];
  }

  if (boxType === 'boss_top1') {
    const table = { tentacles: 0.3, xp: 0.2, weapon: 0.3, setItem: 0.2 };
    return [rollByTable(table, 3000, 1000), rollByTable(table, 3000, 1000)];
  }

  if (boxType === 'boss_top10') {
    return [rollByTable({ tentacles: 0.4, xp: 0.25, weapon: 0.25, setItem: 0.1 }, 1500, 500)];
  }

  if (boxType === 'boss_top100') {
    return [rollByTable({ tentacles: 0.55, xp: 0.3, weapon: 0.13, setItem: 0.02 }, 600, 200)];
  }

  if (boxType === 'boss_part' || boxType === 'activity') {
    return [rollByTable({ tentacles: 0.7, xp: 0.25, weapon: 0.05, setItem: 0 }, 200, 80)];
  }

  if (boxType === 'poison_pack') {
    pushGuaranteed(drops, [
      { type: 'weapon', name: 'Small Poison', qty: [8, 12], extra: { id: 'satchel' } },
      { type: 'weapon', name: 'Medium Poison', qty: [3, 5], extra: { id: 'f1' } },
      { type: 'weapon', name: 'Big Poison', qty: 1, extra: { id: 'c4' } },
      { type: 'tentacles', name: 'tentacles', qty: [500, 1000] },
    ]);
    drops.push(...rollChanceDrops([
      { chance: 0.35, type: 'weapon', name: 'Big Poison', qty: 1, extra: { id: 'c4' } },
      { chance: 0.30, type: 'weapon', name: 'Small Poison', qty: 5, extra: { id: 'satchel' } },
      { chance: 0.20, type: 'energy', name: 'Energy', qty: [20, 40] },
      { chance: 0.15, type: 'spin', name: 'Spin', qty: 1 },
    ]));
    return drops;
  }

  if (boxType === 'boss_damage_pack') {
    pushGuaranteed(drops, [
      { type: 'energy', name: 'Energy', qty: [120, 180] },
      { type: 'tentacles', name: 'tentacles', qty: [2500, 4500] },
      { type: 'weapon', name: 'Small Poison', qty: [10, 16], extra: { id: 'satchel' } },
      { type: 'weapon', name: 'Medium Poison', qty: [4, 7], extra: { id: 'f1' } },
      { type: 'weapon', name: 'Big Poison', qty: [1, 2], extra: { id: 'c4' } },
      { type: 'spin', name: 'Spin', qty: 1 },
    ]);
    drops.push(...rollChanceDrops([
      { chance: 0.30, type: 'weapon', name: 'Big Poison', qty: 1, extra: { id: 'c4' } },
      { chance: 0.25, type: 'energy', name: 'Energy', qty: 60 },
      { chance: 0.20, type: 'weapon', name: 'Medium Poison', qty: 3, extra: { id: 'f1' } },
      { chance: 0.15, type: 'tentacles', name: 'tentacles', qty: 2500 },
      { chance: 0.10, type: 'spin', name: 'Spin', qty: 2 },
    ]));
    return drops;
  }

  if (boxType === 'weekly_progress_pack') {
    pushGuaranteed(drops, [
      { type: 'energy', name: 'Energy', qty: [600, 900] },
      { type: 'tentacles', name: 'tentacles', qty: [18000, 30000] },
      { type: 'weapon', name: 'Small Poison', qty: [45, 70], extra: { id: 'satchel' } },
      { type: 'weapon', name: 'Medium Poison', qty: [18, 30], extra: { id: 'f1' } },
      { type: 'weapon', name: 'Big Poison', qty: [6, 10], extra: { id: 'c4' } },
      { type: 'spin', name: 'Spin', qty: 10 },
    ]);
    drops.push(...rollChanceDrops([
      { chance: 0.30, type: 'weapon', name: 'Big Poison', qty: 5, extra: { id: 'c4' } },
      { chance: 0.25, type: 'energy', name: 'Energy', qty: 250 },
      { chance: 0.20, type: 'tentacles', name: 'tentacles', qty: 10000 },
      { chance: 0.15, type: 'spin', name: 'Spin', qty: 5 },
      { chance: 0.10, type: 'premium', name: 'T-Pape', qty: [100, 200] },
    ]));
    return drops;
  }

  if (boxType === 'starter_offer') {
    pushGuaranteed(drops, [
      { type: 'energy', name: 'Energy', qty: 120 },
      { type: 'tentacles', name: 'tentacles', qty: 3000 },
      { type: 'weapon', name: 'Small Poison', qty: 10, extra: { id: 'satchel' } },
      { type: 'weapon', name: 'Medium Poison', qty: 3, extra: { id: 'f1' } },
      { type: 'spin', name: 'Spin', qty: 3 },
    ]);
    drops.push(...rollChanceDrops([
      { chance: 0.20, type: 'weapon', name: 'Big Poison', qty: 1, extra: { id: 'c4' } },
      { chance: 0.15, type: 'energy', name: 'Energy', qty: 50 },
    ]));
    return drops;
  }

  if (boxType === 'first_boss_offer') {
    pushGuaranteed(drops, [
      { type: 'energy', name: 'Energy', qty: 220 },
      { type: 'tentacles', name: 'tentacles', qty: 6000 },
      { type: 'weapon', name: 'Small Poison', qty: 16, extra: { id: 'satchel' } },
      { type: 'weapon', name: 'Medium Poison', qty: 6, extra: { id: 'f1' } },
      { type: 'weapon', name: 'Big Poison', qty: 1, extra: { id: 'c4' } },
      { type: 'spin', name: 'Spin', qty: 2 },
    ]);
    drops.push(...rollChanceDrops([
      { chance: 0.25, type: 'weapon', name: 'Big Poison', qty: 1, extra: { id: 'c4' } },
      { chance: 0.20, type: 'energy', name: 'Energy', qty: 80 },
      { chance: 0.15, type: 'tentacles', name: 'tentacles', qty: 3000 },
    ]));
    return drops;
  }

  if (boxType === 'weekly_offer') {
    pushGuaranteed(drops, [
      { type: 'energy', name: 'Energy', qty: 350 },
      { type: 'tentacles', name: 'tentacles', qty: 9000 },
      { type: 'weapon', name: 'Small Poison', qty: 24, extra: { id: 'satchel' } },
      { type: 'weapon', name: 'Medium Poison', qty: 10, extra: { id: 'f1' } },
      { type: 'weapon', name: 'Big Poison', qty: 3, extra: { id: 'c4' } },
      { type: 'spin', name: 'Spin', qty: 6 },
    ]);
    drops.push(...rollChanceDrops([
      { chance: 0.25, type: 'weapon', name: 'Big Poison', qty: 2, extra: { id: 'c4' } },
      { chance: 0.20, type: 'energy', name: 'Energy', qty: 120 },
      { chance: 0.15, type: 'spin', name: 'Spin', qty: 3 },
    ]));
    return drops;
  }

  if (boxType === 'invite_box') {
    return [
      { type: 'tentacles', name: 'tentacles', qty: 500 },
      { type: 'xp', name: 'XP', qty: 100 },
      { type: 'weapon', name: 'Small Poison', qty: 3, id: 'satchel' },
    ];
  }

  if (boxType === 'big_invite_box') {
    return [
      { type: 'tentacles', name: 'tentacles', qty: 1200 },
      { type: 'xp', name: 'XP', qty: 250 },
      { type: 'weapon', name: 'Small Poison', qty: 5, id: 'satchel' },
      { type: 'weapon', name: 'Medium Poison', qty: 1, id: 'f1' },
    ];
  }

  if (boxType === 'rare_invite_box') {
    return [
      { type: 'tentacles', name: 'tentacles', qty: 2500 },
      { type: 'xp', name: 'XP', qty: 500 },
      { type: 'weapon', name: 'Small Poison', qty: 8, id: 'satchel' },
      { type: 'weapon', name: 'Medium Poison', qty: 2, id: 'f1' },
      { type: 'weapon', name: 'Big Poison', qty: 1, id: 'c4' },
    ];
  }

  if (boxType === 'epic_invite_box') {
    return [
      { type: 'tentacles', name: 'tentacles', qty: 5000 },
      { type: 'xp', name: 'XP', qty: 1000 },
      { type: 'weapon', name: 'Small Poison', qty: 12, id: 'satchel' },
      { type: 'weapon', name: 'Medium Poison', qty: 4, id: 'f1' },
      { type: 'weapon', name: 'Big Poison', qty: 2, id: 'c4' },
    ];
  }

  if (boxType === 'daily_toxic_pack') {
    pushGuaranteed(drops, [
      { type: 'weapon', name: 'Small Poison', qty: [3, 5], extra: { id: 'satchel' } },
      { type: 'weapon', name: 'Medium Poison', qty: 1, extra: { id: 'f1' } },
      { type: 'tentacles', name: 'tentacles', qty: [200, 500] },
    ]);
    drops.push(...rollChanceDrops([
      { chance: 0.20, type: 'weapon', name: 'Big Poison', qty: 1, extra: { id: 'c4' } },
    ]));
    return drops;
  }

  return [];
}

export function getBoxForRank(rank) {
  if (rank === 1) return 'top_gold';
  if (rank <= 3) return 'top_silver';
  if (rank <= 10) return 'top_bronze';
  if (rank <= 50) return 'top_small';
  return null;
}

export function getDamageBoxForDamage(damage, maxDamageBox = 'damage_box_5') {
  const boxes = [
    { type: 'damage_box_5', threshold: 250000 },
    { type: 'damage_box_4', threshold: 50000 },
    { type: 'damage_box_3', threshold: 10000 },
    { type: 'damage_box_2', threshold: 2500 },
    { type: 'damage_box_1', threshold: 100 },
  ];
  const maxIndex = boxes.findIndex((box) => box.type === maxDamageBox);
  const allowed = maxIndex === -1 ? boxes : boxes.slice(maxIndex);
  return allowed.find((box) => damage >= box.threshold)?.type || null;
}

export function getMaxDamageBoxForBoss(boss) {
  const hp = boss?.maxHp || boss?.max_hp || 0;
  if (hp >= 250000) return 'damage_box_5';
  if (hp >= 50000) return 'damage_box_4';
  if (hp >= 10000) return 'damage_box_3';
  if (hp >= 2500) return 'damage_box_2';
  return 'damage_box_1';
}

export function getBossDamageBoxIcon(damage, maxHp) {
  return getConfiguredBossDamageBoxIcon(damage, maxHp);
}

export function rollBossDamageReward({ damage, bossId, maxHp }) {
  const hp = Math.max(1, Math.floor(Number(maxHp) || 1));
  const appliedDamage = Math.min(hp, Math.max(0, Math.floor(Number(damage) || 0)));
  if (!appliedDamage) return [];

  const drops = [
    { type: 'tentacles', name: 'tentacles', qty: Math.floor((100 + Math.floor(appliedDamage * 0.009)) * 0.5) },
    { type: 'xp', name: 'EXP', qty: Math.floor((10 + Math.floor(appliedDamage * 0.001)) * 0.5) },
  ];
  const strength = Math.floor(Math.floor(appliedDamage / 10000) * 0.5);
  if (strength > 0) drops.push({ type: 'strength', name: 'Сила', qty: strength });
  return drops;
}

const BOSS_BOX_TABLES = {
  standard_boss: {
    guaranteed: [
      { type: 'tentacles', name: 'tentacles', qty: [50, 150] },
      { type: 'xp', name: 'EXP', qty: [10, 25] },
    ],
    rolls: 1,
    bonus: [
      { type: 'energy', name: 'Енергія', qty: [3, 8], weight: 40 },
      { type: 'tentacles', name: 'tentacles', qty: [50, 100], weight: 20 },
      { type: 'energy', name: 'Енергія', qty: [2, 6], weight: 15 },
      { type: 'strength', name: 'Сила', qty: [1, 2], weight: 8 },
      { type: 'poison', name: 'Яд', qty: 1, weight: 3 },
      { type: 'premium', name: 'Зірки', qty: 1, weight: 1 },
      { type: 'nothing', name: 'Nothing', qty: 0, weight: 6 },
    ],
  },
  damage_box_1: {
    guaranteed: [
      { type: 'tentacles', name: 'tentacles', qty: [50, 120] },
      { type: 'xp', name: 'EXP', qty: [10, 20] },
    ],
    rolls: 1,
    bonus: [
      { type: 'energy', name: 'Енергія', qty: [5, 10], weight: 30 },
      { type: 'energy', name: 'Енергія', qty: [4, 8], weight: 20 },
      { type: 'tentacles', name: 'tentacles', qty: [50, 120], weight: 20 },
      { type: 'strength', name: 'Сила', qty: [1, 3], weight: 15 },
      { type: 'poison', name: 'Яд', qty: 1, weight: 3 },
    ],
  },
  damage_box_2: {
    guaranteed: [
      { type: 'tentacles', name: 'tentacles', qty: [120, 250] },
      { type: 'xp', name: 'EXP', qty: [20, 40] },
      { type: 'strength', name: 'Сила', qty: [3, 5] },
    ],
    rolls: 1,
    bonus: [
      { type: 'energy', name: 'Енергія', qty: [8, 15], weight: 25 },
      { type: 'energy', name: 'Енергія', qty: [6, 10], weight: 25 },
      { type: 'tentacles', name: 'tentacles', qty: [100, 200], weight: 15 },
      { type: 'poison', name: 'Яд', qty: 1, weight: 7 },
      { type: 'premium', name: 'Зірки', qty: 1, weight: 5 },
      { type: 'boss_gear_piece', name: 'Шмотка боса', qty: 1, weight: 3 },
    ],
  },
  damage_box_3: {
    guaranteed: [
      { type: 'tentacles', name: 'tentacles', qty: [300, 550] },
      { type: 'xp', name: 'EXP', qty: [45, 80] },
      { type: 'strength', name: 'Сила', qty: [5, 10] },
    ],
    rolls: 2,
    bonus: [
      { type: 'energy', name: 'Енергія', qty: [8, 14], weight: 25 },
      { type: 'energy', name: 'Енергія', qty: [15, 25], weight: 15 },
      { type: 'poison', name: 'Яд', qty: 1, weight: 12 },
      { type: 'tentacles', name: 'tentacles', qty: [250, 450], weight: 10 },
      { type: 'premium', name: 'Зірки', qty: [1, 2], weight: 8 },
      { type: 'boss_gear_piece', name: 'Шмотка боса', qty: 1, weight: 5 },
    ],
  },
  damage_box_4: {
    guaranteed: [
      { type: 'tentacles', name: 'tentacles', qty: [600, 1100] },
      { type: 'xp', name: 'EXP', qty: [90, 160] },
      { type: 'strength', name: 'Сила', qty: [12, 25] },
    ],
    rolls: 2,
    bonus: [
      { type: 'energy', name: 'Енергія', qty: [10, 18], weight: 20 },
      { type: 'poison', name: 'Яд', qty: [1, 2], weight: 15 },
      { type: 'tentacles', name: 'tentacles', qty: [500, 1000], weight: 13 },
      { type: 'premium', name: 'Зірки', qty: [2, 4], weight: 12 },
      { type: 'boss_gear_piece', name: 'Шмотка боса', qty: 1, weight: 10 },
      { type: 'boss_pet', name: 'Пет боса', qty: 1, weight: 1.82 },
      { type: 'boss_background', name: 'Сцена боса', qty: 1, weight: 0.5 },
    ],
  },
  damage_box_5: {
    guaranteed: [
      { type: 'tentacles', name: 'tentacles', qty: [1200, 2600] },
      { type: 'xp', name: 'EXP', qty: [170, 320] },
      { type: 'strength', name: 'Сила', qty: [30, 60] },
      { type: 'poison', name: 'Яд', qty: 1 },
    ],
    rolls: 3,
    bonus: [
      { type: 'energy', name: 'Енергія', qty: [14, 24], weight: 20 },
      { type: 'poison', name: 'Яд', qty: [2, 4], weight: 15 },
      { type: 'premium', name: 'Зірки', qty: [5, 10], weight: 15 },
      { type: 'boss_gear_piece', name: 'Шмотка боса', qty: 1, weight: 14 },
      { type: 'boss_pet', name: 'Пет боса', qty: 1, weight: 0.93 },
      { type: 'boss_background', name: 'Сцена боса', qty: 1, weight: 0.35 },
      { type: 'tentacles', name: 'tentacles', qty: [1500, 3200], weight: 4 },
    ],
  },
  top_small: {
    guaranteed: [
      { type: 'tentacles', name: 'tentacles', qty: [300, 700] },
      { type: 'xp', name: 'EXP', qty: [50, 100] },
    ],
    rolls: 1,
    bonus: [
      { type: 'strength', name: 'Сила', qty: [3, 7], weight: 25 },
      { type: 'energy', name: 'Енергія', qty: [6, 12], weight: 25 },
      { type: 'tentacles', name: 'tentacles', qty: [300, 600], weight: 15 },
      { type: 'poison', name: 'Яд', qty: 1, weight: 8 },
      { type: 'premium', name: 'Зірки', qty: [1, 2], weight: 5 },
      { type: 'boss_gear_piece', name: 'Шмотка боса', qty: 1, weight: 2 },
    ],
  },
  top_bronze: {
    guaranteed: [
      { type: 'tentacles', name: 'tentacles', qty: [800, 1500] },
      { type: 'xp', name: 'EXP', qty: [120, 220] },
      { type: 'strength', name: 'Сила', qty: [8, 15] },
    ],
    rolls: 2,
    bonus: [
      { type: 'energy', name: 'Енергія', qty: [8, 16], weight: 25 },
      { type: 'tentacles', name: 'tentacles', qty: [800, 1500], weight: 20 },
      { type: 'poison', name: 'Яд', qty: 1, weight: 12 },
      { type: 'premium', name: 'Зірки', qty: [1, 3], weight: 10 },
      { type: 'boss_gear_piece', name: 'Шмотка боса', qty: 1, weight: 5 },
      { type: 'boss_pet', name: 'Пет боса', qty: 1, weight: 0.36 },
      { type: 'boss_background', name: 'Сцена боса', qty: 1, weight: 0.25 },
    ],
  },
  top_silver: {
    guaranteed: [
      { type: 'tentacles', name: 'tentacles', qty: [1500, 3000] },
      { type: 'xp', name: 'EXP', qty: [250, 450] },
      { type: 'strength', name: 'Сила', qty: [20, 35] },
    ],
    rolls: 2,
    bonus: [
      { type: 'energy', name: 'Енергія', qty: [10, 20], weight: 20 },
      { type: 'poison', name: 'Яд', qty: [1, 2], weight: 15 },
      { type: 'premium', name: 'Зірки', qty: [3, 6], weight: 15 },
      { type: 'boss_gear_piece', name: 'Шмотка боса', qty: 1, weight: 14 },
      { type: 'boss_pet', name: 'Пет боса', qty: 1, weight: 0.70 },
      { type: 'boss_background', name: 'Сцена боса', qty: 1, weight: 0.35 },
      { type: 'tentacles', name: 'tentacles', qty: [1500, 3000], weight: 5 },
    ],
  },
  top_gold: {
    guaranteed: [
      { type: 'tentacles', name: 'tentacles', qty: [1500, 3200] },
      { type: 'xp', name: 'EXP', qty: [120, 220] },
      { type: 'strength', name: 'Сила', qty: [20, 40] },
      { type: 'poison', name: 'Яд', qty: 1 },
    ],
    rolls: 3,
    bonus: [
      { type: 'energy', name: 'Енергія', qty: [12, 22], weight: 15 },
      { type: 'poison', name: 'Яд', qty: [2, 5], weight: 15 },
      { type: 'premium', name: 'Зірки', qty: [8, 15], weight: 15 },
      { type: 'boss_pet', name: 'Пет боса', qty: 1, weight: 0.67 },
      { type: 'boss_gear_piece', name: 'Шмотка боса', qty: 1, weight: 12 },
      { type: 'boss_background', name: 'Сцена боса', qty: 1, weight: 0.25 },
      { type: 'tentacles', name: 'tentacles', qty: [5000, 10000], weight: 8 },
    ],
  },
};

export function getBossBoxTables() {
  return structuredClone(BOSS_BOX_TABLES);
}

export function sanitizeBossBoxTables(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const validTypes = new Set(['tentacles', 'xp', 'energy', 'strength', 'poison', 'premium', 'boss_gear_piece', 'boss_pet', 'boss_background', 'nothing', 'keycard']);
  const result = {};
  for (const [boxType, table] of Object.entries(value)) {
    if (!BOSS_BOX_TABLES[boxType] || !table || typeof table !== 'object') continue;
    const normalizeRow = (row) => {
      const type = String(row?.type || '').trim();
      if (!validTypes.has(type)) return null;
      const min = Math.max(0, Math.floor(Number(Array.isArray(row.qty) ? row.qty[0] : row.qty) || 0));
      const max = Math.max(min, Math.floor(Number(Array.isArray(row.qty) ? row.qty[1] : row.qty) || min));
      return {
        type,
        name: String(row?.name || type).slice(0, 60),
        qty: Array.isArray(row?.qty) ? [min, max] : min,
        ...(Number.isFinite(Number(row?.weight)) ? { weight: Math.max(0, Number(row.weight)) } : {}),
      };
    };
    const guaranteed = Array.isArray(table.guaranteed) ? table.guaranteed.map(normalizeRow).filter(Boolean) : [];
    const bonus = Array.isArray(table.bonus) ? table.bonus.map(normalizeRow).filter(Boolean) : [];
    if (!guaranteed.length && !bonus.length) continue;
    result[boxType] = { guaranteed, bonus, rolls: Math.max(0, Math.min(20, Math.floor(Number(table.rolls) || 0))) };
  }
  return result;
}



