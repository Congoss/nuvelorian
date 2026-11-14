import { RAID_BOSS_START_AT } from './raidBossConfig.js';
import { getFriday13PlayerReward } from './friday13Event.js';

export function currentRaidRewardReceipt(profile) {
  const encounter = `global-raid-boss:${RAID_BOSS_START_AT}`;
  const receipt = profile?.raid_rank_rewards?.[encounter];
  if (!receipt || !Number.isInteger(receipt.rank) || receipt.rank < 1 || receipt.rank > 100) return null;
  return { ...receipt, encounter, reward: receipt.reward || getFriday13PlayerReward(receipt.rank) };
}
