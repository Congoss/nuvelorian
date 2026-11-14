import { getFriday13PlayerReward } from './friday13Event.js';

export const RAID_PET_ID = 'raidboss2_pet';
export const RAID_CROWN_IDS = ['raidboss2_crown_accessory', 'raidboss2_crown2_accessory', 'raidboss2_crown3_accessory'];
export const RAID_RANK_TIERS = [
  { from: 1, to: 1, small: 100, medium: 80, large: 60, spins: 100, energy: 375 },
  { from: 2, to: 2, small: 90, medium: 70, large: 50, spins: 75, energy: 300 },
  { from: 3, to: 3, small: 80, medium: 60, large: 40, spins: 50, energy: 225 },
  { from: 4, to: 10, small: 50, medium: 40, large: 30, spins: 30, energy: 150 },
  { from: 11, to: 25, small: 40, medium: 30, large: 20, spins: 20, energy: 112 },
  { from: 26, to: 50, small: 30, medium: 20, large: 10, spins: 10, energy: 75 },
  { from: 51, to: 100, small: 20, medium: 10, large: 5, spins: 5, energy: 37 },
];
export function getRaidRankReward(rank) {
  if (!Number.isInteger(rank)) return null;
  const tier = RAID_RANK_TIERS.find(tier => rank >= tier.from && rank <= tier.to);
  if (!tier) return null;
  return { ...tier, rank, crownId: rank <= 3 ? RAID_CROWN_IDS[rank - 1] : null, petId: rank <= 3 ? RAID_PET_ID : null,
    boxType: rank === 1 ? 'top_gold' : rank === 2 ? 'top_silver' : rank === 3 ? 'top_bronze' : 'top_small',
    eventBonus: getFriday13PlayerReward(rank),
    drops: [{ type: 'weapon', id: 'satchel', qty: tier.small }, { type: 'weapon', id: 'f4', qty: tier.medium }, { type: 'weapon', id: 'c4', qty: tier.large }, { type: 'spin', qty: tier.spins }, { type: 'energy', qty: tier.energy }],
  };
}

export function rankRaidParticipants(participants = {}) {
  return Object.entries(participants).filter(([, entry]) => Number(entry?.damage) > 0)
    .map(([playerId, entry]) => ({ playerId, damage: Number(entry.damage), hits: Number(entry.hits) || 0 }))
    .sort((a, b) => b.damage - a.damage || b.hits - a.hits || a.playerId.localeCompare(b.playerId));
}
