import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldReceiveBossFightDamageReward } from './clanBossDamage.js';

test('damage rewards stay owner-only for personal fights without invitees', () => {
  const fight = { opened_by_email: 'owner@example.com' };
  assert.equal(shouldReceiveBossFightDamageReward(fight, { player_email: 'owner@example.com' }), true);
  assert.equal(shouldReceiveBossFightDamageReward(fight, { player_email: 'clanmate@example.com' }), false);
});

test('invitation fights reward only the owner and invited contributors with damage logs', () => {
  const fight = { opened_by_email: 'owner@example.com', invited_player_ids: ['player-2'] };
  assert.equal(shouldReceiveBossFightDamageReward(fight, { player_email: 'owner@example.com' }), true);
  assert.equal(shouldReceiveBossFightDamageReward(fight, { player_email: 'clanmate@example.com', player_id: 'player-2' }), true);
  assert.equal(shouldReceiveBossFightDamageReward(fight, { player_email: 'outsider@example.com', player_id: 'outsider' }), false);
  assert.equal(shouldReceiveBossFightDamageReward(fight, { player_email: '' }), false);
});
