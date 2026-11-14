import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyRouletteReward,
  resolveRouletteRewardById,
  ROULETTE_REWARD_DEFS,
  ROULETTE_WHEEL_SECTOR_ORDER,
  getRouletteRewardCenterAngleByIndex,
  getRouletteRewardIndex,
  selectRouletteReward,
} from '../src/lib/rouletteRewards.js';

test('roulette wheel order matches reward definition order', () => {
  assert.deepEqual(
    ROULETTE_WHEEL_SECTOR_ORDER,
    [...ROULETTE_REWARD_DEFS]
      .sort((a, b) => Number(a.wheelIndex || 0) - Number(b.wheelIndex || 0))
      .map((reward) => reward.id),
  );
});

test('roulette selection uses one rng call and stable index mapping', () => {
  let calls = 0;
  const selection = selectRouletteReward(() => {
    calls += 1;
    return 0;
  });

  assert.equal(calls, 1);
  assert.equal(selection.rewardIndex, selection.reward.wheelIndex);
  assert.equal(getRouletteRewardIndex(selection.reward.id), selection.reward.wheelIndex);
  assert.equal(
    getRouletteRewardCenterAngleByIndex(selection.rewardIndex),
    (90 - selection.reward.wheelIndex * (360 / ROULETTE_REWARD_DEFS.length) + 360) % 360,
  );
});


test('empty wheel sector grants no resources while old pending spin rewards also grant nothing', () => {
  const player = { energy: 50, roulette_bonus_spins: 3, weapon_inventory: { 'large-poison': 2 } };
  const reward = selectRouletteReward(() => 0).reward;
  assert.equal(reward.id, 'reward_nothing');
  assert.equal(reward.type, 'nothing');
  assert.equal(reward.amount, 0);
  applyRouletteReward(player, reward);
  assert.equal(player.energy, 50);
  assert.equal(player.roulette_bonus_spins, 3);
  assert.deepEqual(player.weapon_inventory, { 'large-poison': 2 });
  assert.equal(player.roulette_last_reward_id, 'reward_nothing');
  assert.equal(ROULETTE_WHEEL_SECTOR_ORDER.includes('reward_free_spin'), false);
  applyRouletteReward(player, { id: 'reward_free_spin', type: 'spin', amount: 1 });
  assert.equal(player.roulette_bonus_spins, 3);
  assert.equal(resolveRouletteRewardById('reward_free_spin').id, 'reward_nothing');
});
