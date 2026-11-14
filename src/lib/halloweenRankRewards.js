export const HALLOWEEN_RANK_TIERS = [
  { from: 1, to: 1, small: 200, medium: 160, large: 100, spins: 100, energy: 750 },
  { from: 2, to: 2, small: 150, medium: 120, large: 75, spins: 75, energy: 675 },
  { from: 3, to: 3, small: 120, medium: 95, large: 60, spins: 50, energy: 600 },
  { from: 4, to: 10, small: 90, medium: 70, large: 45, spins: 30, energy: 525 },
  { from: 11, to: 25, small: 60, medium: 45, large: 30, spins: 20, energy: 375 },
  { from: 26, to: 50, small: 40, medium: 30, large: 20, spins: 10, energy: 187 },
  { from: 51, to: 100, small: 25, medium: 15, large: 10, spins: 5, energy: 75 },
];

export function getHalloweenRankReward(rank) {
  if (!Number.isInteger(rank)) return null;
  const tier = HALLOWEEN_RANK_TIERS.find(entry => rank >= entry.from && rank <= entry.to);
  if (!tier) return null;
  return {
    ...tier,
    rank,
    boxType: rank === 1 ? 'top_gold' : rank === 2 ? 'top_silver' : rank === 3 ? 'top_bronze' : 'top_small',
    drops: [
      { type: 'weapon', id: 'satchel', qty: tier.small },
      { type: 'weapon', id: 'f4', qty: tier.medium },
      { type: 'weapon', id: 'c4', qty: tier.large },
      { type: 'spin', qty: tier.spins },
      { type: 'energy', qty: tier.energy },
    ],
  };
}
