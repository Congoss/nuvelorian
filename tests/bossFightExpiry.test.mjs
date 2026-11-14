import assert from 'node:assert/strict';
import test from 'node:test';
import { expireStaleBossFights } from '../server/utils/clanBossDamage.js';

test('expires a personal boss fight at six hours without awarding a kill', () => {
  const now = Date.parse('2026-10-07T00:00:00.000Z');
  const expired = { id: 'old', status: 'active', started_at: new Date(now - 6 * 3600000).toISOString(), current_hp: 50 };
  const ongoing = { id: 'new', status: 'active', started_at: new Date(now - 1000).toISOString(), current_hp: 50 };
  assert.equal(expireStaleBossFights([expired, ongoing], now), 1);
  assert.equal(expired.status, 'expired');
  assert.equal(expired.ended_at, new Date(now).toISOString());
  assert.equal(ongoing.status, 'active');
  assert.equal(expireStaleBossFights([expired, ongoing], now), 0);
});
