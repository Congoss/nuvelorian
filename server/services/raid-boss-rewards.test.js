import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateRaidRewardAmounts, getRaidRewardMailCopy } from './raid-boss-rewards.js';

test('calculates raid rewards at the configured rate per 1,000 damage', () => {
  assert.deepEqual(calculateRaidRewardAmounts(384998, 0, [{ field: 'tentacles', rate: 100 }]), [
    { field: 'tentacles', amount: 38500 },
  ]);
});

test('raid reward mail follows the receiving player language', () => {
  assert.deepEqual(getRaidRewardMailCopy('ru'), { title: 'Награда за рейд-босса', text: 'Награда за участие в битве с рейд-боссом.' });
  assert.deepEqual(getRaidRewardMailCopy('uk'), { title: 'Нагорода за рейд-боса', text: 'Нагорода за участь у битві з рейд-босом.' });
  assert.deepEqual(getRaidRewardMailCopy('en'), { title: 'Raid boss reward', text: 'Reward for participating in the Raid Boss battle.' });
  assert.deepEqual(getRaidRewardMailCopy('ru-RU'), getRaidRewardMailCopy('ru'));
});

test('applies a 1.5 multiplier when at least one poison was consumed', () => {
  assert.deepEqual(calculateRaidRewardAmounts(1000, 1, [{ field: 'large_poison', rate: 100 }]), [
    { field: 'large_poison', amount: 150 },
  ]);
});
