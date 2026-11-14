export const LEVEL_MILESTONES = [10, 20, 30, 40, 50];

const PACKS = {
  10: [1500, 100, 10, 3, 1, 1],
  20: [2500, 150, 15, 5, 2, 1],
  30: [3500, 200, 20, 8, 3, 2],
  40: [5000, 250, 25, 10, 4, 3],
  50: [7500, 300, 30, 15, 6, 5],
};

export function getLevelMilestoneRewards(level) {
  const [tentacles, energy, smallPoison, mediumPoison, largePoison, spins] = PACKS[level] || [];
  return { tentacles, energy, smallPoison, mediumPoison, largePoison, spins };
}

export function getPendingLevelMilestones(profile) {
  const claimed = new Set((profile?.level_milestone_rewards_claimed || []).map(Number));
  return LEVEL_MILESTONES.filter((level) => Number(profile?.level || 1) >= level && !claimed.has(level));
}
