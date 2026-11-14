import test from 'node:test';
import assert from 'node:assert/strict';
import { getHalloweenRankReward } from '../src/lib/halloweenRankRewards.js';
import { awardHalloweenRankRewards } from '../server/services/halloween-rank-rewards.js';
import { HALLOWEEN } from '../src/lib/halloweenEvent.js';

test('Halloween rank reward tiers match the approved table', () => {
  assert.deepEqual(getHalloweenRankReward(1).drops.map(drop => drop.qty), [200, 160, 100, 100, 750]);
  assert.deepEqual(getHalloweenRankReward(2).drops.map(drop => drop.qty), [150, 120, 75, 75, 675]);
  assert.deepEqual(getHalloweenRankReward(3).drops.map(drop => drop.qty), [120, 95, 60, 50, 600]);
  assert.deepEqual(getHalloweenRankReward(10).drops.map(drop => drop.qty), [90, 70, 45, 30, 525]);
  assert.deepEqual(getHalloweenRankReward(25).drops.map(drop => drop.qty), [60, 45, 30, 20, 375]);
  assert.deepEqual(getHalloweenRankReward(50).drops.map(drop => drop.qty), [40, 30, 20, 10, 187]);
  assert.deepEqual(getHalloweenRankReward(100).drops.map(drop => drop.qty), [25, 15, 10, 5, 75]);
  assert.equal(getHalloweenRankReward(101), null);
});

test('Halloween rank boxes are queued once after the event', () => {
  const players = Array.from({ length: 101 }, (_, index) => ({ id: String(index + 1), halloween_event: { id: HALLOWEEN.id, activityEarned: 101 - index } }));
  const beforeEnd = Date.parse(HALLOWEEN.endAt) - 1;
  assert.deepEqual(awardHalloweenRankRewards(players, { now: beforeEnd }), []);
  const afterEnd = Date.parse(HALLOWEEN.endAt) + 1;
  assert.equal(awardHalloweenRankRewards(players, { now: afterEnd }).length, 100);
  assert.equal(players[0].pending_boss_boxes[0].rewardFormula, 'halloween_rank_v1');
  assert.deepEqual(players[0].pending_boss_boxes[0].rewardSnapshot.map(drop => drop.qty), [200, 160, 100, 100, 750]);
  assert.equal(players[100].pending_boss_boxes, undefined);
  assert.deepEqual(awardHalloweenRankRewards(players, { now: afterEnd }), []);
});
