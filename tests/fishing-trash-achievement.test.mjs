import test from 'node:test';
import assert from 'node:assert/strict';
import { recordFishingAchievement, claimAchievementReward } from '../server/utils/playerAchievements.js';

test('five consecutive trash catches unlock once; other fish and empty casts reset', () => {
  const player = {};
  const trash = () => recordFishingAchievement(player, true, 1000, 'trash');
  for (let i = 0; i < 4; i++) trash();
  assert.equal(player.player_achievements?.fishing_trash_5, undefined);
  recordFishingAchievement(player, true, 1000, 'common');
  assert.equal(player.achievement_progress.fishingTrash, 0);
  trash(); recordFishingAchievement(player, false, 1000);
  assert.equal(player.achievement_progress.fishingTrash, 0);
  for (let i = 0; i < 5; i++) trash();
  const receipt = player.player_achievements.fishing_trash_5;
  assert.equal(receipt.reward_status, 'pending');
  trash(); assert.equal(player.player_achievements.fishing_trash_5, receipt);
  claimAchievementReward(player, 'fishing_trash_5');
  claimAchievementReward(player, 'fishing_trash_5');
  assert.equal(player.weapon_inventory['medium-poison'], 20);
  assert.equal(player.roulette_bonus_spins, 10);
});
