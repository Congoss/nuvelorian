// ============================================================
// RUST SURVIVAL вЂ” Game Config
// ============================================================

export const GAME_CONFIG = {
  // Energy
  ENERGY_REGEN_PER_MIN: 2,
  MAX_ENERGY_BASE: 100,

  // Passive tentacles income
  BASE_TENTACLES_PER_HOUR: 10,

  CONTENT_UNLOCK_LEVELS: {
    daily: 3,
    roulette: 4,
    bossTab: 5,
    skillsTab: 8,
    equipment: 10,
    clanTab: 18,
    pets: 25,
    worldBoss: 30,
  },

  // PvP raids
  RAID_ENERGY_COST: 20,
  RAID_FAIL_PENALTY: 10,

  // Upgrades (cost in tentacles)
  UPGRADES: {
    attack: {
      name: 'Weapon',
      description: 'Increases damage to bosses',
      baseCost: 100,
      costMultiplier: 1.8,
      powerPerLevel: 8,
    },
    defense: {
      name: 'Fence',
      description: 'Reduces losses during raids',
      baseCost: 120,
      costMultiplier: 1.8,
      reductionPerLevel: 0.02,
    },
    income: {
      name: 'tentacles Farm',
      description: 'More tentacles per hour',
      baseCost: 80,
      costMultiplier: 1.6,
      incomePerLevel: 5,
    },
    stash: {
      name: 'Stash',
      description: 'Increases protected reserve',
      baseCost: 150,
      costMultiplier: 1.5,
      capacityPerLevel: 250,
    },
  },

  // Locations
  LOCATIONS: [
    { id: 'beach',   name: 'РџР»СЏР¶',           minLevel: 1,  icon: 'рџЏ–пёЏ', color: '#f59e0b' },
    { id: 'factory', name: 'Factory', minLevel: 15, icon: '??', color: '#6b7280' },
    { id: 'oilrig', name: 'Oil Rig', minLevel: 22, icon: '???', color: '#ef4444' },
  ],

  // Tasks per location
  TASKS: [
    { id: 'gather_wood',  location: 'beach',   name: 'Р—Р±РёСЂР°С‚Рё РґРµСЂРµРІРёРЅСѓ',    energyCost: 5,  tentacles: 12,  xp: 10,  successRate: 1.0,  completionsRequired: 10, keycardChance: 0 },
    { id: 'loot_barrel',  location: 'beach',   name: 'Р РѕР·С–Р±СЂР°С‚Рё Р±РѕС‡РєСѓ',     energyCost: 8,  tentacles: 20,  xp: 15,  successRate: 1.0,  completionsRequired: 10, keycardChance: 0 },
    { id: 'hunt_animal',  location: 'beach',   name: 'РџРѕР»СЋРІР°РЅРЅСЏ',           energyCost: 12, tentacles: 55,  xp: 30,  successRate: 0.75, completionsRequired: 10, keycardChance: 0 },
    { id: 'beach_cache',  location: 'beach',   name: 'РЎС…РѕРІР°РЅРєР° РЅР° РїР»СЏР¶С–',   energyCost: 15, tentacles: 90,  xp: 45,  successRate: 0.80, completionsRequired: 10, keycardChance: 0 },
    { id: 'beach_patrol', location: 'beach',   name: 'Р—РЅРµС€РєРѕРґРёС‚Рё РїР°С‚СЂСѓР»СЊ',  energyCost: 20, tentacles: 200, xp: 70,  successRate: 0.65, completionsRequired: 10, keycardChance: 0.05 },
    { id: 'tentacles_metal',  location: 'factory', name: 'Р—Р±РёСЂР°С‚Рё РјРµС‚Р°Р»РѕР±СЂСѓС…С‚', energyCost: 10, tentacles: 30,  xp: 25,  successRate: 1.0,  completionsRequired: 10, keycardChance: 0 },
    { id: 'factory_box',  location: 'factory', name: 'РЇС‰РёРє Р· РґРµС‚Р°Р»СЏРјРё',     energyCost: 14, tentacles: 55,  xp: 40,  successRate: 0.90, completionsRequired: 10, keycardChance: 0 },
    { id: 'raid_cache',   location: 'factory', name: 'РћР±С€СѓРє СЃС…РѕРІР°РЅРєРё',      energyCost: 20, tentacles: 120, xp: 55,  successRate: 0.65, completionsRequired: 10, keycardChance: 0 },
    { id: 'hack_panel',   location: 'factory', name: 'Р—Р»Р°РјР°С‚Рё РїР°РЅРµР»СЊ',      energyCost: 25, tentacles: 200, xp: 75,  successRate: 0.55, completionsRequired: 10, keycardChance: 0 },
    { id: 'factory_boss_prep', location: 'factory', name: 'РџС–РґРіРѕС‚РѕРІРєР° РґРѕ РЅР°РїР°РґСѓ', energyCost: 35, tentacles: 350, xp: 110, successRate: 0.50, completionsRequired: 10, keycardChance: 0.05 },
    { id: 'oil_pump',     location: 'oilrig',  name: 'РљР°С‡Р°С‚Рё РЅР°С„С‚Сѓ',        energyCost: 15, tentacles: 60,  xp: 40,  successRate: 1.0,  completionsRequired: 10, keycardChance: 0 },
    { id: 'oil_crate',    location: 'oilrig',  name: 'РЇС‰РёРє РЅР°С„С‚РѕРІРёРєР°',      energyCost: 20, tentacles: 110, xp: 60,  successRate: 0.85, completionsRequired: 10, keycardChance: 0 },
    { id: 'armed_patrol', location: 'oilrig',  name: 'Р—РЅРµС€РєРѕРґРёС‚Рё РїР°С‚СЂСѓР»СЊ',  energyCost: 35, tentacles: 400, xp: 110, successRate: 0.45, completionsRequired: 10, keycardChance: 0 },
    { id: 'oil_control',  location: 'oilrig',  name: 'Р¦РµРЅС‚СЂ РєРµСЂСѓРІР°РЅРЅСЏ',     energyCost: 40, tentacles: 550, xp: 140, successRate: 0.40, completionsRequired: 10, keycardChance: 0 },
    { id: 'boss_loot',    location: 'oilrig',  name: "РЎРµР№С„ РІ'СЏР·РЅРёС†С–",       energyCost: 45, tentacles: 700, xp: 160, successRate: 0.35, completionsRequired: 10, keycardChance: 0.05 },
  ],

  // Boss fights вЂ” SHARED, co-op
  BOSSES: [
    { id: 'heli', name: 'Недоважок', names: { ru: 'Недовес', ua: 'Недоважок', en: 'Underweight' }, location: 'parcel', maxHp: 1000, icon: '📦', color: '#f59e0b', minLevel: 1, keycardLocation: 'parcel', reward: { tentacles: 0 } },
    { id: 'tank', name: 'Міль', names: { ru: 'Моль', ua: 'Міль', en: 'Moth' }, location: 'colorless', maxHp: 10000, icon: '🌫️', color: '#6b7280', minLevel: 15, keycardLocation: 'colorless', reward: { tentacles: 0 } },
    { id: 'chinook', name: 'Шорк', names: { ru: 'Шорк', ua: 'Шорк', en: 'Shork' }, location: 'junkyard', maxHp: 50000, icon: '🗑️', color: '#ef4444', minLevel: 22, keycardLocation: 'junkyard', reward: { tentacles: 0 } },
    { id: 'boss4', name: 'Глиста', names: { ru: 'Глиста', ua: 'Глиста', en: 'Worm' }, location: 'whale', maxHp: 100000, icon: '🐋', color: '#f97316', minLevel: 40, keycardLocation: 'whale', reward: { tentacles: 0 } },
    { id: 'boss5', name: 'Споргол', names: { ru: 'Споргол', ua: 'Споргол', en: 'Sporgol' }, location: 'spore', maxHp: 500000, icon: '🍄', color: '#dc2626', minLevel: 55, keycardLocation: 'spore', reward: { tentacles: 0 } },
    { id: 'boss6', name: 'Засмокт', names: { ru: 'Засос', ua: 'Засмокт', en: 'Suckhole' }, location: 'blackhole025', maxHp: 2000000, icon: '🕳️', color: '#7c3aed', minLevel: 70, keycardLocation: 'blackhole025', reward: { tentacles: 0 } },
    { id: 'boss7', name: 'Клеопатреш', names: { ru: 'Клеопатреш', ua: 'Клеопатреш', en: 'Cleopatrash' }, location: 'teletron', maxHp: 3000000, icon: '🐍', color: '#c99b42', minLevel: 80, keycardLocation: 'teletron', reward: { tentacles: 0 } },
    { id: 'boss8', name: 'Шкрябан', names: { ru: 'Шкрябан', ua: 'Шкрябан', en: 'Shkraban' }, location: 'playground404', maxHp: 7000000, icon: '🛝', color: '#16a34a', minLevel: 90, keycardLocation: 'playground404', reward: { tentacles: 0 } },
    { id: 'boss9', name: 'Грюмбо', names: { ru: 'Грюмбо', ua: 'Грюмбо', en: 'Grumbo' }, location: 'playground404v2', maxHp: 5000000, icon: '🛝', color: '#be123c', minLevel: 100, keycardLocation: 'playground404v2', reward: { tentacles: 0 } },
  ],

  // Weapons for boss fights
  // costType: 'free' | 'tentacles' | 'premium'
  WEAPONS: [
    { id: 'fist',    name: 'Палець',         icon: '/skills/slap.webp',          damage: 20,  cost: 0, costType: 'free', cooldownMin: 10, description: 'Базовий ляпас' },
    { id: 'knuckle', name: 'Олівець',        icon: '/skills/fork-strike.webp',   damage: 50,  cost: 0, costType: 'free', cooldownMin: 20, description: 'Швидкий удар виделкою' },
    { id: 'satchel', name: 'Мала отрута',    icon: '/skills/small-poison.webp',  damage: 35,  cost: 0, costType: 'free', cooldownMin: 0,  description: 'Використовується тільки з інвентаря' },
    { id: 'f4',      name: 'Середня отрута', icon: '/skills/medium-poison.webp', damage: 70,  cost: 0, costType: 'free', cooldownMin: 0, description: 'Використовується тільки з інвентаря' },
    { id: 'c4',      name: 'Фляга з отрутою',  icon: '/skills/large-poison.webp',  damage: 200, cost: 0, costType: 'free', cooldownMin: 0, description: 'Використовується тільки з інвентаря' },
  ],

  // Boss rewards by rank
  BOSS_REWARDS: {
    top1:    { tentacles: 1.0, dropRare: true,   medal: 'gold'   },
    top10:   { tentacles: 0.5, dropRare: false,  medal: 'silver' },
    top50:   { tentacles: 0.2, dropRare: false,  medal: 'bronze' },
    default: { tentacles: 0.1, dropRare: false,  medal: null     },
  },

  // Medal thresholds (total boss kills contribution)
  MEDALS: {
    bronze: { minDamage: 10,   icon: 'рџҐ‰', label: 'Р‘СЂРѕРЅР·Р°' },
    silver: { minDamage: 50,   icon: 'рџҐ€', label: 'РЎСЂС–Р±Р»Рѕ' },
    gold:   { minDamage: 100,  icon: 'рџҐ‡', label: 'Р—РѕР»РѕС‚Рѕ' },
  },

  // Collections per location
  COLLECTIONS: {
    beach: [
      { id: 'c1', name: 'Р†СЂР¶Р°РІРёР№ Р±РѕР»С‚',     icon: 'рџ”©' },
      { id: 'c2', name: 'РњСѓС€Р»СЏ',            icon: 'рџђљ' },
      { id: 'c3', name: 'Р“С–Р»СЊР·Р°',           icon: 'рџ”«' },
      { id: 'c4', name: 'Р”РµСЂРµРІ\'СЏРЅР° РјР°СЃРєР°', icon: 'рџЄµ' },
      { id: 'c5', name: 'РњРµРґРёС‡РЅРёР№ Р±РёРЅС‚',    icon: 'рџ©№' },
    ],
    factory: [
      { id: 'f1', name: 'РЎС‚Р°СЂР° РїР»Р°С‚Р°',      icon: 'рџ”Њ' },
      { id: 'f2', name: 'РўСЂСѓР±Р°',            icon: 'вљ™пёЏ' },
      { id: 'f3', name: 'Р”РµС‚РѕРЅР°С‚РѕСЂ',        icon: 'рџ’Ј' },
      { id: 'f4', name: 'Р‘СЂРѕРЅРµР¶РёР»РµС‚',       icon: 'рџ¦є' },
      { id: 'f5', name: 'РђРєСѓРјСѓР»СЏС‚РѕСЂ',       icon: 'рџ”‹' },
    ],
    oilrig: [
      { id: 'o1', name: 'Р Р°РєРµС‚РЅРёС†СЏ',        icon: 'рџљЂ' },
      { id: 'o2', name: 'РЎ4',               icon: 'рџ’Ґ' },
      { id: 'o3', name: 'Р‘СЂРѕРЅРµС€РѕР»РѕРј',       icon: 'в›‘пёЏ' },
      { id: 'o4', name: 'Р”СЂРѕРЅРѕРІР° РєР°РјРµСЂР°',   icon: 'рџ“Ў' },
      { id: 'o5', name: 'Р›Р°Р·РµСЂРЅРёР№ РїСЂРёС†С–Р»',  icon: 'рџ”ґ' },
    ],
  },

  // Set bonus: completing all items in a location's collection
  COLLECTION_SET_BONUS: {
    damagePct: 0.10,   // +10% boss damage
    dropChancePct: 0.02, // +2% drop chance
  },

  // Leveling
  XP_BASE: 39,
  XP_INCREMENT: 18,
};

export function getLocalizedBossName(boss, language = 'ua') {
  const code = language === 'uk' ? 'ua' : language;
  return boss?.names?.[code] || boss?.names?.ua || boss?.name || '';
}


const XP_TOTALS_BY_LEVEL = [
  0, 39, 96, 171, 264, 375, 504, 651, 816, 1000,
  1201, 1420, 1657, 1912, 2186, 2477, 2786, 3113, 3459, 3822,
  4203, 4603, 5020, 5455, 5909, 6380, 6869, 7377, 7902, 8446,
  9007, 9587, 10184, 10800, 11433, 12085, 12754, 13442, 14147, 14871,
  15612, 16372, 17150, 17945, 18759, 19590, 20440, 21308, 22193, 23097,
  24019, 24959, 25916, 26892, 27886, 28898, 29927, 30975, 32041, 33125,
  34227, 35347, 36485, 37640, 38814, 40006, 41216, 42444, 43690, 44954,
  46236, 47536, 48854, 50190, 51544, 52916, 54306, 55714, 57140, 58585,
  60047, 61527, 63025, 64541, 66075, 67627, 69198, 70786, 72392, 74016,
  75659, 77319, 78997, 80693, 82408, 84140, 85890, 87659, 89445, 91250,
  93072, 94912, 96771, 98647, 100542, 102454, 104385, 106333, 108300, 110284,
  112287, 114307, 116346, 118402, 120477, 122569, 124680, 126809, 128955, 131120,
  133303, 135503, 137722, 139959, 142213, 144486, 146777, 149086, 151412, 153757,
  156120, 158501, 160900, 163316, 165751, 168204, 170675, 173164, 175671, 178196,
];

export function getUpgradeCost(type, currentLevel) {
  const upgrade = GAME_CONFIG.UPGRADES[type];
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel - 1));
}

export function getXpForLevel(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  const previousTotal = getTotalXpForLevel(safeLevel);
  const nextTotal = getTotalXpForLevel(safeLevel + 1);
  return Math.max(1, nextTotal - previousTotal);
}

export function getTotalXpForLevel(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  if (safeLevel <= XP_TOTALS_BY_LEVEL.length) {
    return XP_TOTALS_BY_LEVEL[safeLevel - 1];
  }

  let total = XP_TOTALS_BY_LEVEL[XP_TOTALS_BY_LEVEL.length - 1];
  let lastStep = total - XP_TOTALS_BY_LEVEL[XP_TOTALS_BY_LEVEL.length - 2];

  for (let currentLevel = XP_TOTALS_BY_LEVEL.length; currentLevel < safeLevel; currentLevel += 1) {
    lastStep += GAME_CONFIG.XP_INCREMENT;
    total += lastStep;
  }

  return total;
}

export function calculatePendingIncome(lastCollect, incomePerHour) {
  if (!lastCollect) return 0;
  const hoursDiff = (new Date() - new Date(lastCollect)) / (1000 * 60 * 60);
  return Math.floor(hoursDiff * incomePerHour);
}

export function calculateEnergy(lastUpdate, currentEnergy, maxEnergy, regenRate) {
  const safeCurrent = Math.max(0, Number(currentEnergy) || 0);
  const safeCap = Math.max(1, Number(maxEnergy) || GAME_CONFIG.MAX_ENERGY_BASE);
  const regenPerMin = Number(regenRate) || GAME_CONFIG.ENERGY_REGEN_PER_MIN;
  if (!lastUpdate || safeCurrent >= safeCap) {
    if (safeCurrent >= safeCap) {
      console.log('[energy] regen stopped', { currentEnergy: safeCurrent, regenCap: safeCap });
    }
    return safeCurrent;
  }
  const minutesDiff = (new Date() - new Date(lastUpdate)) / (1000 * 60);
  const gained = Math.max(0, minutesDiff * regenPerMin);
  const nextEnergy = Math.min(safeCurrent + gained, safeCap);
  console.log('[energy] regen started', {
    currentEnergy: safeCurrent,
    regenCap: safeCap,
    gained,
    nextEnergy,
  });
  return nextEnergy;
}

export function getTaskCompletions(profile, taskId) {
  return (profile?.task_completions || {})[taskId] || 0;
}

export function getUnlockedTaskIndex(profile, location) {
  const tasks = GAME_CONFIG.TASKS.filter(t => t.location === location);
  let unlocked = 0;
  for (let i = 0; i < tasks.length; i++) {
    const completions = getTaskCompletions(profile, tasks[i].id);
    if (completions >= tasks[i].completionsRequired) {
      unlocked = i + 1;
    } else {
      break;
    }
  }
  return Math.min(unlocked, tasks.length - 1);
}

export function isLocationComplete(profile, location) {
  const tasks = GAME_CONFIG.TASKS.filter(t => t.location === location);
  return tasks.every(t => getTaskCompletions(profile, t.id) >= t.completionsRequired);
}

// Returns damage multiplier from completed collection sets
export function getCollectionDamageBonus(profile) {
  const owned = profile?.collection_items || [];
  let completedSets = 0;
  Object.values(GAME_CONFIG.COLLECTIONS).forEach(items => {
    if (items.every(i => owned.includes(i.id))) completedSets++;
  });
  return 1 + completedSets * GAME_CONFIG.COLLECTION_SET_BONUS.damagePct;
}

// Returns extra drop chance from completed sets
export function getCollectionDropBonus(profile) {
  const owned = profile?.collection_items || [];
  let completedSets = 0;
  Object.values(GAME_CONFIG.COLLECTIONS).forEach(items => {
    if (items.every(i => owned.includes(i.id))) completedSets++;
  });
  return completedSets * GAME_CONFIG.COLLECTION_SET_BONUS.dropChancePct;
}

// Get medal for a player based on total boss damage dealt
export function calculateRaidSuccess(attackPower, defensePower, isRevenge) {
  const ratio = attackPower / (attackPower + defensePower);
  const base = 0.3 + ratio * 0.4;
  return Math.min(base + (isRevenge ? 0.15 : 0), 0.95);
}

export function calculateStealAmount(unsafeTentacles, defenseLevel) {
  const reduction = Math.min(defenseLevel * 0.02, 0.15);
  const pct = 0.10 + Math.random() * 0.10;
  return Math.floor(unsafeTentacles * Math.max(pct - reduction, 0.05));
}

export function getMedalForDamage(totalDamage) {
  if (totalDamage >= GAME_CONFIG.MEDALS.gold.minDamage) return 'gold';
  if (totalDamage >= GAME_CONFIG.MEDALS.silver.minDamage) return 'silver';
  if (totalDamage >= GAME_CONFIG.MEDALS.bronze.minDamage) return 'bronze';
  return null;
}





export const SKILL_BASES = {
  finger: {
    damage: 20,
    labels: {
      ua: 'Палець',
      ru: 'Палец',
      en: 'Finger',
    },
  },
  pencil: {
    damage: 50,
    labels: {
      ua: 'Олівець',
      ru: 'Карандаш',
      en: 'Pencil',
    },
  },
  smallPoison: {
    damage: 35,
    labels: {
      ua: 'Мала отрута',
      ru: 'Малый яд',
      en: 'Small Poison',
    },
  },
  mediumPoison: {
    damage: 70,
    labels: {
      ua: 'Середня отрута',
      ru: 'Средний яд',
      en: 'Medium Poison',
    },
  },
  bigPoison: {
    damage: 200,
    labels: {
      ua: 'Фляга з отрутою',
      ru: 'Фляга с ядом',
      en: 'Big Poison',
    },
  },
};


export function getBaseEnergyRegenRate(player = {}) {
  const savedBase = Number(player.energy_regen_base_rate) || Number(player.energy_regen_rate) / (1 + Number(player.equipment_energy_regen_pct || 0));
  return Math.max(GAME_CONFIG.ENERGY_REGEN_PER_MIN, Number.isFinite(savedBase) ? savedBase : 0);
}
