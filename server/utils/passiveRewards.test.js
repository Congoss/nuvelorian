import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuestMission } from '../../src/lib/questMissionCatalog.js';
import { ensurePassiveTimer, passiveReward, claimPassiveReward, PASSIVE_INTERVAL_MS } from './passiveRewards.js';
import { applyPlayerAction } from './playerActions.js';

const completed = () => ({ tentacles: 100, stat_strength: 1, xp: 0, task_completions: Object.fromEntries(['scout', 'loot', 'repair', 'trade', 'fight', 'cache', 'final'].map(slug => { const t = getQuestMission(`p4-u00-${slug}`); return [t.id, t.target]; })) });
test('one persistent timer across reads and devices; elapsed time never claims', () => {
  const player = completed();
  ensurePassiveTimer(player, 1000000);
  const ready = player.location_passive_ready_at.global;
  ensurePassiveTimer(player, 1000000 + PASSIVE_INTERVAL_MS * 3);
  assert.equal(player.location_passive_ready_at.global, ready);
  assert.equal(player.tentacles, 100);
  assert.throws(() => claimPassiveReward(player, 1000001), { code: 'AFK_NOT_READY' });
  const reward = claimPassiveReward(player, 1000000 + PASSIVE_INTERVAL_MS * 3);
  assert.deepEqual(reward, passiveReward(player));
  assert.throws(() => claimPassiveReward(player, 1000000 + PASSIVE_INTERVAL_MS * 3), { code: 'AFK_NOT_READY' });
});
test('explicit server action grants exactly once including XP', () => {
  const player = completed();
  player.location_passive_ready_at = { global: new Date(0).toISOString() };
  const reward = passiveReward(player);
  applyPlayerAction(player, { type: 'claim-afk' });
  assert.equal(player.tentacles, 100 + reward.tentacles);
  assert.equal(player.stat_strength, 1 + reward.strength);
  assert.equal(player.xp, reward.xp);
  assert.throws(() => applyPlayerAction(player, { type: 'claim-afk' }), { code: 'AFK_NOT_READY' });
  assert.equal(player.tentacles, 100 + reward.tentacles);
});
test('legacy timestamps restored without resetting expired rewards', () => {
  const player = completed();
  player.location_passive_last_claim_at = new Date(0).toISOString();
  ensurePassiveTimer(player, PASSIVE_INTERVAL_MS * 2);
  assert.equal(Date.parse(player.location_passive_ready_at.global), PASSIVE_INTERVAL_MS);
  assert.ok(claimPassiveReward(player, PASSIVE_INTERVAL_MS * 2).percent);
});
