import test from 'node:test';
import assert from 'node:assert/strict';
import { currentRaidRewardReceipt } from '../src/lib/raidRewardReceipt.js';
import { RAID_BOSS_START_AT } from '../src/lib/raidBossConfig.js';
import { awardRaidRankRewards, repairRaidGuildFrames } from '../server/services/raid-rank-rewards.js';

const encounter = `global-raid-boss:${RAID_BOSS_START_AT}`;
test('new settlement assigns clan nameplate to clan and saves the personal reward snapshot', () => {
  const players = [{id:'p',clan_id:'c'}], clans = [{id:'c'}];
  const raid = {id:'global-raid-boss',started_at:RAID_BOSS_START_AT,status:'dead',participants:{p:{damage:10}}};
  awardRaidRankRewards(raid,players,{clans});
  assert.equal(clans[0].raid_header_theme,'friday13_guild_1');
  assert.deepEqual(players[0].unlocked_profile_banners,['friday13_player_1']);
  assert.equal(currentRaidRewardReceipt(players[0]).reward.smallPoison,300);
});
test('completed raid moves guild frames to recorded winning clans without regranting rewards', () => {
  const players = [{ id:'p', profile_header_theme:'friday13_guild_2', unlocked_profile_banners:['friday13_player_1','friday13_guild_2'], weapon_inventory:{'small-poison':7} }];
  const clans = [{id:'c', ship:{paidCredit:75_000_000}}];
  const raid = {rank_rewards_completed_at:'done',guild_rewards_sent:{c:{rank:2}}};
  assert.deepEqual(repairRaidGuildFrames(raid, players, clans), {changed:['p'],clanChanged:true});
  assert.equal(clans[0].raid_header_theme, 'friday13_guild_2');
  assert.equal(players[0].profile_header_theme, null);
  assert.deepEqual(players[0].unlocked_profile_banners,['friday13_player_1']);
  assert.equal(players[0].weapon_inventory['small-poison'],7);
  assert.equal(clans[0].ship.paidCredit,75_000_000);
  assert.deepEqual(repairRaidGuildFrames(raid, players, clans), {changed:[],clanChanged:false});
});
test('historical direct grants can be viewed repeatedly without changing inventory or receipts', () => {
  const profile = { weapon_inventory: { 'small-poison': 7 }, raid_rank_rewards: { [encounter]: { rank: 1, at: '2026-11-14' } } };
  const before = JSON.stringify(profile);
  for (let i = 0; i < 3; i++) assert.equal(currentRaidRewardReceipt(profile).reward.smallPoison, 300);
  assert.equal(JSON.stringify(profile), before);
});
test('only confirmed receipts from this encounter are shown, preserving stored reward amounts', () => {
  assert.equal(currentRaidRewardReceipt({}), null);
  assert.equal(currentRaidRewardReceipt({ raid_rank_rewards: { old: { rank: 1 } } }), null);
  for (const rank of [0, 101, 1.5]) assert.equal(currentRaidRewardReceipt({ raid_rank_rewards: { [encounter]: { rank } } }), null);
  const reward = { smallPoison: 17 };
  assert.deepEqual(currentRaidRewardReceipt({ raid_rank_rewards: { [encounter]: { rank: 2, reward } } }).reward, reward);
});
