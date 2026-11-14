import test from 'node:test';
import assert from 'node:assert/strict';
import { compensateTalentPoints } from '../server/utils/talentCompensation.js';
import { resetPlayerTalents } from '../server/utils/talentReset.js';

test('compensation adds spendable points, survives reset, and retries grant once', () => {
  const player = { talent_tree_version: 2, available_talent_points: 6, talent_points: 6,
    talent_levels: { t01: 2 }, total_talent_points_spent: 2, total_talent_points_earned: 8 };
  compensateTalentPoints(player, 1, 'compensation-test-1');
  assert.equal(player.available_talent_points, 7);
  assert.equal(player.talent_points, 7);
  assert.equal(player.total_talent_points_earned, 9);
  assert.deepEqual(player.talent_levels, { t01: 2 });
  assert.equal(compensateTalentPoints(player, 1, 'compensation-test-1').alreadyGranted, true);
  assert.equal(player.available_talent_points, 7);
  assert.equal(player.talent_compensation_history.length, 1);
  resetPlayerTalents(player);
  assert.equal(player.available_talent_points, 9);
});

test('legacy points migrate and invalid amounts cannot mutate the player', () => {
  const player = { talent_points: 6 };
  for (const amount of [0, -1, 1.5, '1', NaN, Infinity, 100001]) {
    assert.throws(() => compensateTalentPoints(player, amount, 'compensation-test-2'), { code: 'TALENT_COMPENSATION_INVALID' });
    assert.deepEqual(player, { talent_points: 6 });
  }
  compensateTalentPoints(player, 1, 'compensation-test-2');
  assert.equal(player.available_talent_points, 7);
  assert.equal(player.total_talent_points_earned, 7);
});
