import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_CONFIG } from './gameConfig.js';
import { openBox } from './lootBoxes.js';

test('openBox safely ignores malformed configured reward lists', () => {
  const rewards = openBox('test_box', GAME_CONFIG.BOSSES[0].id, {
    test_box: { guaranteed: {}, bonus: { unexpected: true }, rolls: 4, extraChanceDrops: null },
  });
  assert.deepEqual(rewards, []);
});
