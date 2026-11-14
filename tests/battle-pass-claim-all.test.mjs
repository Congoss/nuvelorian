import test from 'node:test';
import assert from 'node:assert/strict';
import { battlePassView, recordBattlePassEvent, claimBattlePassReward, claimAllBattlePassRewards, unlockBattlePassTier } from '../server/utils/battlePass.js';
import { BP_LEVEL_XP, BP_REWARDS, BP_TRACKS, bpTrackUnlocked } from '../src/lib/battlePass.js';

process.env.BATTLE_PASS_ENABLED = 'true';
process.env.BATTLE_PASS_START = '2026-09-28T00:00:00Z';
process.env.BATTLE_PASS_END = '2026-10-26T00:00:00Z';
const now = Date.parse('2026-10-09T12:00:00Z');

for (const tier of BP_TRACKS) {
  test(`claim all ${tier} grants the same rewards as individual claims, exactly once`, () => {
    const player = {energy:0, premium:0, tentacles:0};
    recordBattlePassEvent(player, {type:'login'}, now);
    player.battle_pass.xp = 22 * BP_LEVEL_XP;
    if (tier !== 'free') unlockBattlePassTier(player, tier, now);
    claimBattlePassReward(player, {level:1, track:'free'}, now);
    const initial = battlePassView(player, now);
    const expected = BP_REWARDS.flatMap(row => row.level <= initial.level
      ? BP_TRACKS.filter(track => bpTrackUnlocked(tier, track) && !initial.claims.includes(`${track}:${row.level}`)).map(track => ({level:row.level, track})) : []);
    const individually = structuredClone(player);
    for (const reward of expected) claimBattlePassReward(individually, reward, now);
    assert.deepEqual(claimAllBattlePassRewards(player, now), expected);
    assert.deepEqual(player, individually);
    // Claiming free rewards can advance XP; verify retry with the resulting
    // completed claims rather than treating newly unlocked levels as duplicates.
    claimAllBattlePassRewards(player, now);
    const settled = structuredClone(player);
    assert.deepEqual(claimAllBattlePassRewards(player, now), []);
    assert.deepEqual(player, settled);
  });
}

test('expired season grants nothing', () => {
  const player = {};
  recordBattlePassEvent(player, {type:'login'}, now);
  player.battle_pass.xp = 50 * BP_LEVEL_XP;
  assert.throws(() => claimAllBattlePassRewards(player, Date.parse('2026-12-02T00:00:00Z')), /not active/);
  assert.equal(player.premium, undefined);
});
