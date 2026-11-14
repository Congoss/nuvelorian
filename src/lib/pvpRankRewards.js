import { PVP_RANK_THRESHOLDS } from './pvpRanks.js';

export const PVP_RANK_REWARD_BASE = Object.freeze({ smallPoison: 40, mediumPoison: 40, largePoison: 40, spins: 10, cardPlays: 5 });
export function getPvpRankReward(rank) {
  if (!Number.isInteger(rank) || rank < 1 || rank > PVP_RANK_THRESHOLDS.length) return null;
  return { rank, requiredRating: PVP_RANK_THRESHOLDS[rank - 1], ...Object.fromEntries(Object.entries(PVP_RANK_REWARD_BASE).map(([key, value]) => [key, value * rank])) };
}
export function canClaimPvpRankReward(rank, progress) {
  const reward = getPvpRankReward(rank);
  return Boolean(reward && progress?.hasVictory && Number(progress.highestRating) >= reward.requiredRating && !(progress.claimedRanks || []).includes(rank));
}
