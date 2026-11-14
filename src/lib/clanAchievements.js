export const CLAN_ACHIEVEMENT_CONFIG = {
  damage: {
    maxLevel: 10,
    thresholds: [100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000, 100000000],
    benefit: (level) => ({ poisonPct: level }),
  },
  quests: {
    maxLevel: 10,
    thresholds: [1, 5, 15, 35, 70, 125, 210, 330, 500, 750],
    benefit: (level) => ({ maxTier: Math.max(1, Math.min(10, level)) }),
  },
  helper: {
    maxLevel: 10,
    thresholds: [10, 30, 60, 100, 150, 210, 280, 360, 450, 550],
    benefit: (level) => ({ maxEnergyRequest: 50 + Math.max(0, level - 1) * 5 }),
  },
  donations: {
    maxLevel: 15,
    thresholds: [25000, 75000, 200000, 500000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000, 100000000, 200000000, 350000000, 550000000, 800000000],
    contributionCaps: [2500, 7500, 20000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000, 20000000, 35000000, 55000000, 80000000],
    benefit: (level) => ({ maxMembers: Math.min(100, 25 + level * 5) }),
  },
};

const CLAN_QUEST_TIER_DATA = [
  { tier: 1, durationHours: 2, targets: { damage: 300, energy: 35, missions: 3, hits: 3, tentacles: 100 }, reward: { tentacles: 100, xp: 50 } },
  { tier: 2, durationHours: 3, targets: { damage: 700, energy: 60, missions: 5, hits: 5, tentacles: 220 }, reward: { tentacles: 220, xp: 100 } },
  { tier: 3, durationHours: 4, targets: { damage: 1300, energy: 90, missions: 7, hits: 8, tentacles: 400 }, reward: { tentacles: 400, xp: 180, poisons: { small: 1 } } },
  { tier: 4, durationHours: 6, targets: { damage: 2200, energy: 125, missions: 10, hits: 12, tentacles: 650 }, reward: { tentacles: 700, xp: 300, poisons: { large: 1 } } },
  { tier: 5, durationHours: 8, targets: { damage: 3500, energy: 170, missions: 14, hits: 17, tentacles: 1000 }, reward: { tentacles: 1100, xp: 450, poisons: { small: 1, medium: 1 } }, helpEnabled: true },
  { tier: 6, durationHours: 10, targets: { damage: 5200, energy: 220, missions: 18, hits: 23, tentacles: 1500 }, reward: { tentacles: 1600, xp: 650, poisons: { small: 1, medium: 1, large: 1 } }, helpEnabled: true },
  { tier: 7, durationHours: 12, targets: { damage: 7500, energy: 280, missions: 23, hits: 30, tentacles: 2200 }, reward: { tentacles: 2300, xp: 900, poisons: { small: 2, medium: 1, large: 1 } }, helpEnabled: true },
  { tier: 8, durationHours: 16, targets: { damage: 10500, energy: 350, missions: 30, hits: 40, tentacles: 3200 }, reward: { tentacles: 3200, xp: 1200, poisons: { small: 2, medium: 2, large: 2 } }, helpEnabled: true },
  { tier: 9, durationHours: 20, targets: { damage: 14000, energy: 430, missions: 38, hits: 52, tentacles: 4500 }, reward: { tentacles: 4500, xp: 1600, poisons: { small: 3, medium: 2, large: 2 } }, helpEnabled: true },
  { tier: 10, durationHours: 24, targets: { damage: 18000, energy: 520, missions: 48, hits: 65, tentacles: 6000 }, reward: { tentacles: 6000, xp: 2100, poisons: { small: 3, medium: 3, large: 3 } }, helpEnabled: true },
];

export const CLAN_QUEST_DEFINITIONS = CLAN_QUEST_TIER_DATA.flatMap((tier) => Object.entries(tier.targets).map(([type, target]) => ({
  id: `tier-${tier.tier}-${type}`,
  tier: tier.tier,
  type,
  target,
  durationHours: tier.durationHours,
  reward: tier.reward,
  helpEnabled: Boolean(tier.helpEnabled),
})));

export const CLAN_QUEST_TIERS = CLAN_QUEST_TIER_DATA.map(({ tier, durationHours, reward }) => ({ tier, durationHours, reward }));

export function getClanAchievementState(type, state = {}) {
  const config = CLAN_ACHIEVEMENT_CONFIG[type];
  if (!config) return { level: 0, progress: 0, nextThreshold: 0, maxed: true, benefit: {} };
  const progress = Math.max(0, Number(state.progress || 0));
  const earnedLevel = config.thresholds.filter((threshold) => progress >= threshold).length;
  const level = Math.min(config.maxLevel, type === 'quests' ? Math.max(1, earnedLevel) : earnedLevel);
  return {
    level,
    progress,
    nextThreshold: config.thresholds[level] || config.thresholds.at(-1) || 0,
    maxed: level >= config.maxLevel,
    benefit: config.benefit(level),
    nextBenefit: config.benefit(Math.min(config.maxLevel, level + 1)),
  };
}

export function createClanAchievements() {
  return Object.fromEntries(Object.keys(CLAN_ACHIEVEMENT_CONFIG).map((type) => [type, { level: 0, progress: type === 'quests' ? 1 : 0 }]));
}
