import { getRaidRankReward, rankRaidParticipants } from '../../src/lib/raidRankRewards.js';

export function awardRaidRankRewards(raid, players, { now = Date.now(), endAt } = {}) {
  if (!raid || (!['defeated', 'dead'].includes(raid.status) && !(Date.parse(raid.ends_at || endAt) <= now))) return [];
  const encounter = `${raid.id}:${raid.started_at}`;
  raid.rank_reward_snapshot ||= rankRaidParticipants(raid.participants).slice(0, 100);
  const byId = new Map(players.map(player => [String(player.id), player]));
  const changed = [];
  raid.rank_rewards_sent ||= {};
  for (const [index, row] of raid.rank_reward_snapshot.entries()) {
    const player = byId.get(row.playerId);
    if (!player) continue;
    const reward = getRaidRankReward(index + 1);
    const receipt = player.raid_rank_rewards?.[encounter];
    if (receipt) {
      raid.rank_rewards_sent[row.playerId] = receipt;
      continue;
    }
    const instanceId = `raid-rank:${encounter}:${row.playerId}`;
    player.pending_boss_boxes = [...(player.pending_boss_boxes || []).filter(box => box.instanceId !== instanceId), {
      instanceId, boxType: reward.boxType, source: 'raid_rank', rank: reward.rank,
      rewardFormula: 'raid_rank_v1', rewardSnapshot: reward.drops.map(drop => ({ ...drop })),
      displayName: `Raid Boss · #${reward.rank}`,
    }];
    const inventory = [...(player.inventory_items || [])];
    for (const [id, slot] of [[reward.crownId, 'accessory'], [reward.petId, 'pet']]) {
      if (id && !inventory.some(item => item.id === id)) inventory.push({ id, slot, type: 'equipment', sourceType: 'raid', rarity: 'legendary', count: 1, locked: false });
    }
    player.inventory_items = inventory;
    const issued = { rank: reward.rank, instanceId, at: new Date(now).toISOString() };
    player.raid_rank_rewards = { ...(player.raid_rank_rewards || {}), [encounter]: issued };
    raid.rank_rewards_sent[row.playerId] = issued;
    changed.push(player.id);
  }
  if (raid.rank_reward_snapshot.every(row => raid.rank_rewards_sent[row.playerId])) raid.rank_rewards_completed_at ||= new Date(now).toISOString();
  return changed;
}
