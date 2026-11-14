import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileHalloweenAchievement, claimAchievementReward } from '../server/utils/playerAchievements.js';

test('Halloween achievement counts historical earnings, including spent pumpkins, and claims once', () => {
  const player = { halloween_event: { id: 'halloween-2026', earned: 500, balance: 0, activityEarned: 0 } };
  assert.equal(reconcileHalloweenAchievement(player), true);
  assert.equal(player.player_achievements.halloween_hunter_500.reward_status, 'pending');
  assert.equal(reconcileHalloweenAchievement(player), false);
  claimAchievementReward(player, 'halloween_hunter_500');
  claimAchievementReward(player, 'halloween_hunter_500');
  assert.equal(player.weapon_inventory['medium-poison'], 30);
  assert.equal(player.roulette_bonus_spins, 20);
});

test('Halloween achievement respects threshold and event identity', () => {
  for (const event of [{ id: 'halloween-2026', earned: 499 }, { id: 'other', earned: 999 }]) {
    assert.equal(reconcileHalloweenAchievement({ halloween_event: event }), false);
  }
  assert.equal(reconcileHalloweenAchievement({ halloween_event: { id: 'halloween-2026', activityTotal: 500, earned: 0 } }), true);
});
