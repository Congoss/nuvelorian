import { CA_RANKS, getCARank, getPlayerCA } from './caRankDefinitions.js';

export const getCurrentCARank = (ca) => getCARank(ca).rank;

// One-time milestone packs for reaching each CA rank. Rank 1 is the starting rank.
export const CA_RANK_REWARDS = {
  2: { tentacles: 1000, energy: 30, smallPoison: 5 },
  3: { tentacles: 2500, energy: 40, smallPoison: 10 },
  4: { tentacles: 6000, energy: 50, smallPoison: 15, spins: 2 },
  5: { tentacles: 12500, energy: 60, mediumPoison: 10, spins: 3 },
  6: { tentacles: 25000, energy: 75, mediumPoison: 15, largePoison: 3, spins: 5 },
  7: { tentacles: 50000, energy: 90, mediumPoison: 20, largePoison: 10, spins: 8 },
  8: { tentacles: 100000, energy: 110, mediumPoison: 25, largePoison: 15, spins: 12 },
  9: { tentacles: 175000, energy: 130, largePoison: 20, spins: 15 },
  10: { tentacles: 300000, energy: 150, largePoison: 30, spins: 20 },
  11: { tentacles: 500000, energy: 180, largePoison: 40, spins: 25 },
  12: { tentacles: 900000, energy: 220, largePoison: 55, spins: 35 },
  13: { tentacles: 1500000, energy: 280, largePoison: 75, spins: 45 },
  14: { tentacles: 2500000, energy: 350, largePoison: 100, spins: 60 },
  15: { tentacles: 4000000, energy: 500, largePoison: 150, spins: 80 },
  16: { tentacles: 6500000, energy: 650, largePoison: 200, spins: 105 },
  17: { tentacles: 10500000, energy: 850, largePoison: 275, spins: 140 },
  18: { tentacles: 17000000, energy: 1100, largePoison: 375, spins: 185 },
  19: { tentacles: 27500000, energy: 1400, largePoison: 500, spins: 245 },
};

export function getCARankReward(rank) {
  return CA_RANK_REWARDS[Number(rank)] || null;
}

export function getPendingCARankRewards(profile) {
  const currentRank = getCurrentCARank(getPlayerCA(profile));
  const claimed = new Set((profile?.ca_rank_rewards_claimed || []).map(Number));
  return CA_RANKS
    .filter((rank) => rank.rank > 1 && rank.rank <= currentRank && getCARankReward(rank.rank) && !claimed.has(rank.rank))
    .map((rank) => rank.rank);
}

