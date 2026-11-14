import test from 'node:test';
import assert from 'node:assert/strict';
import { getRaidRankReward, rankRaidParticipants } from '../src/lib/raidRankRewards.js';
import { awardRaidRankRewards } from '../server/services/raid-rank-rewards.js';

test('all reward tier boundaries match the approved quantities', () => {
  const tiers = [[1,1,100,80,60,100,500],[2,2,90,70,50,75,400],[3,3,80,60,40,50,300],[4,10,50,40,30,30,200],[11,25,40,30,20,20,150],[26,50,30,20,10,10,100],[51,100,20,10,5,5,50]];
  for (const [from,to,...amounts] of tiers) for (const rank of new Set([from,to])) {
    const reward = getRaidRankReward(rank);
    assert.deepEqual([reward.small,reward.medium,reward.large,reward.spins,reward.energy],amounts);
    assert.equal(Boolean(reward.crownId && reward.petId),rank <= 3);
    assert.deepEqual(reward.drops.map(drop => drop.qty),amounts);
  }
  for (const rank of [0,101,-1,1.5]) assert.equal(getRaidRankReward(rank),null);
});

test('finished raid rewards positive top 100 only, with deterministic ties and separate cosmetics', () => {
  const participants = Object.fromEntries(Array.from({length:102},(_,i)=>[`p${String(i).padStart(3,'0')}`,{damage:102-i,hits:1}]));
  participants.zero = {damage:0,hits:500};
  const players = Object.keys(participants).map(id=>({id}));
  const raid = {id:'raid',started_at:'2026-10-15',status:'active',ends_at:'2026-10-22',participants};
  assert.deepEqual(awardRaidRankRewards(raid,players,{now:Date.parse('2026-10-21')}),[]);
  const now = Date.parse('2026-10-22');
  assert.equal(awardRaidRankRewards(raid,players,{now}).length,100);
  assert.equal(players[0].inventory_items.length,2);
  assert.equal(players[2].inventory_items.length,2);
  assert.equal(players[3].inventory_items.length,0);
  assert.equal(players[99].pending_boss_boxes[0].rewardSnapshot[2].qty,5);
  assert.equal(players[100].pending_boss_boxes,undefined);
  const saved = JSON.stringify(players);
  assert.deepEqual(awardRaidRankRewards(raid,players,{now}),[]);
  assert.equal(JSON.stringify(players),saved);
  assert.deepEqual(rankRaidParticipants({b:{damage:5,hits:2},a:{damage:5,hits:2}}).map(row=>row.playerId),['a','b']);
});

test('kill settles early; retry after opening a box never reissues it and ranking stays frozen', () => {
  const raid = {id:'raid',started_at:'2026-10-15',status:'defeated',ends_at:'2026-10-22',participants:{a:{damage:20},b:{damage:10}}};
  const players = [{id:'a'},{id:'b'}];
  const now = Date.parse('2026-10-16');
  awardRaidRankRewards(raid,players,{now});
  players[0].pending_boss_boxes=[];
  delete raid.rank_rewards_sent;
  raid.participants.b.damage=100;
  assert.deepEqual(awardRaidRankRewards(raid,players,{now}),[]);
  assert.equal(players[0].pending_boss_boxes.length,0);
  assert.equal(Object.values(players[0].raid_rank_rewards)[0].rank,1);
  assert.equal(raid.rank_rewards_sent.a.rank,1);
});
