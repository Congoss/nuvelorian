import { HALLOWEEN, halloweenState } from '../../src/lib/halloweenEvent.js';
import { getHalloweenRankReward } from '../../src/lib/halloweenRankRewards.js';

export function awardHalloweenRankRewards(players, { now = Date.now() } = {}) {
  if (now < Date.parse(HALLOWEEN.endAt)) return [];
  const ranked = players
    .map(player => ({ player, activity: Number(halloweenState(player, now).activityEarned || 0) }))
    .filter(entry => entry.activity > 0)
    .sort((left, right) => right.activity - left.activity || String(left.player.id).localeCompare(String(right.player.id)))
    .slice(0, 100);
  const changed = [];
  ranked.forEach(({ player }, index) => {
    const reward = getHalloweenRankReward(index + 1);
    if (!reward || player.halloween_rank_rewards?.[HALLOWEEN.id]) return;
    const instanceId = `halloween-rank:${HALLOWEEN.id}:${player.id}`;
    player.pending_boss_boxes = [...(player.pending_boss_boxes || []).filter(box => box.instanceId !== instanceId), {
      instanceId,
      boxType: reward.boxType,
      source: 'halloween_rank',
      rank: reward.rank,
      rewardFormula: 'halloween_rank_v1',
      rewardSnapshot: reward.drops.map(drop => ({ ...drop })),
      displayName: `Halloween 2026 · #${reward.rank}`,
    }];
    player.halloween_rank_rewards = { ...(player.halloween_rank_rewards || {}), [HALLOWEEN.id]: { rank: reward.rank, instanceId, at: new Date(now).toISOString() } };
    changed.push(player.id);
  });
  return changed;
}
