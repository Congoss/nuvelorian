import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyBossEscapeCooldown,
  BOSS_ESCAPE_COOLDOWN_KEY,
  BOSS_ESCAPE_COOLDOWN_MS,
  getBossEscapeCooldownRemaining,
} from '../src/lib/bossEscapeCooldown.js';

test('escaping blocks boss attacks for 30 minutes and preserves weapon cooldowns', () => {
  const now = Date.parse('2026-10-12T08:00:00.000Z');
  assert.equal(BOSS_ESCAPE_COOLDOWN_MS, 30 * 60 * 1000);
  const cooldowns = applyBossEscapeCooldown({ fist: '2026-10-12T07:55:00.000Z' }, now);

  assert.equal(Date.parse(cooldowns[BOSS_ESCAPE_COOLDOWN_KEY]), now + BOSS_ESCAPE_COOLDOWN_MS);
  assert.equal(cooldowns.fist, '2026-10-12T07:55:00.000Z');
  assert.equal(getBossEscapeCooldownRemaining(cooldowns, now), BOSS_ESCAPE_COOLDOWN_MS);
  assert.equal(getBossEscapeCooldownRemaining(cooldowns, now + 5 * 60 * 1000), 25 * 60 * 1000);
});

test('expired or missing escape cooldown does not block boss attacks', () => {
  const now = Date.parse('2026-10-12T08:00:00.000Z');
  assert.equal(getBossEscapeCooldownRemaining({}, now), 0);
  assert.equal(getBossEscapeCooldownRemaining({ [BOSS_ESCAPE_COOLDOWN_KEY]: '2026-10-12T07:59:59.000Z' }, now), 0);
});
