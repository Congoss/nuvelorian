import test from 'node:test';
import assert from 'node:assert/strict';
import { getFlushAp, getLeaderboardReward, getServerProgress, normalizeFlushAmount, VOID_FLUSH_CONFIG } from '../src/lib/voidFlushConfig.js';

test('flush amounts remain non-negative, capped by balance and aligned to the selected resource rate', () => {
  assert.equal(normalizeFlushAmount(-1, 100000, 20000), 0);
  assert.equal(normalizeFlushAmount(57000, 100000, 20000), 40000);
  assert.equal(normalizeFlushAmount(100000, 59000, 20000), 40000);
  assert.equal(normalizeFlushAmount(8, 7, 1), 7);
});

test('AP conversion uses whole points and configured rates only', () => {
  assert.equal(getFlushAp(39999, 0), 1);
  assert.equal(getFlushAp(40000, 2), 4);
  assert.equal(getFlushAp(0, 3), 3);
  assert.equal(getFlushAp(-100000, -3), 0);
});

test('server level progress and tournament prizes come from event configuration', () => {
  const progress = getServerProgress(184200);
  assert.equal(progress.level, 2);
  assert.equal(progress.current, 84200);
  assert.equal(progress.required, 150000);
  assert.equal(getLeaderboardReward(1).uk, VOID_FLUSH_CONFIG.leaderboardRewards[0].reward.uk);
  assert.equal(getLeaderboardReward(100).en, VOID_FLUSH_CONFIG.leaderboardRewards.at(-1).reward.en);
  assert.equal(getLeaderboardReward(101), null);
});
