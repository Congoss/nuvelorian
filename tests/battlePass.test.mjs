import assert from 'node:assert/strict';
import test from 'node:test';
import { BP_BOSS_DAILY_LIMIT, BP_LEVELS, BP_LEVEL_XP, BP_MAX_XP, BP_REWARDS, BP_TASKS } from '../src/lib/battlePass.js';
import { battlePassView, claimBattlePassReward, recordBattlePassBossVictory, recordBattlePassEvent, fullyUnlockBattlePass } from '../server/utils/battlePass.js';

process.env.NODE_ENV = 'test';
process.env.LOCAL_GAME_STATE_PATH = '';
process.env.BATTLE_PASS_TEST_START = '2026-09-14T00:00:00Z';
process.env.BATTLE_PASS_END = '2026-10-12T00:00:00Z';
const start = Date.parse(process.env.BATTLE_PASS_TEST_START);
const day = 86400000;

test('catalog has a 20% XP buffer, boosted currency tracks, early free poisons and corrected gloves', () => {
  const sum = (scope) => BP_TASKS[scope].reduce((n, task) => n + task.xp, 0);
  assert.equal(sum('daily') * 28 + sum('weekly') * 4 + sum('season'), BP_MAX_XP);
  assert.equal(BP_MAX_XP, 9600);
  assert.equal(BP_MAX_XP - BP_LEVELS * BP_LEVEL_XP, 2100);
  const trackTentacles = (track) => BP_REWARDS.flatMap((row) => row[track]).filter((reward) => reward.type === 'dm').reduce((total, reward) => total + reward.amount, 0);
  assert.equal(trackTentacles('free'), 18075);
  assert.equal(trackTentacles('epic'), 15600);
  assert.equal(trackTentacles('legendary'), 31200);
  assert.equal(BP_REWARDS.length, 50);
  assert.equal(BP_REWARDS.slice(0, 10).flatMap((row) => row.free).filter((r) => r.type === 'large').reduce((n, r) => n + r.amount, 0), 4);
  assert.deepEqual(BP_REWARDS[14].legendary, [{ type: 'legendary_hands', amount: 1 }]);
  assert.deepEqual(BP_REWARDS[23].legendary, [{ type: 'energy', amount: 450 }]);
});

test('successful mission only; automatic XP, no repeat awards, UTC resets and expiry', () => {
  const player = { level: 1 };
  recordBattlePassEvent(player, { type: 'mission', success: false, energy: 100 }, start);
  assert.equal(player.battle_pass.xp, 0);
  recordBattlePassEvent(player, { type: 'login' }, start);
  recordBattlePassEvent(player, { type: 'login' }, start);
  assert.equal(player.battle_pass.xp, 12);
  for (let i = 0; i < 10; i++) recordBattlePassEvent(player, { type: 'mission', success: true, energy: 10, dm: 5 }, start);
  assert.equal(player.battle_pass.xp, 132);
  assert.equal(player.battle_pass.season.metrics.missions, 10);
  recordBattlePassEvent(player, { type: 'login' }, start + day);
  assert.equal(player.battle_pass.xp, 144);
  assert.equal(player.battle_pass.daily.metrics.missions, undefined);
  assert.equal(player.battle_pass.weekly.metrics.missions, 10);
  recordBattlePassEvent(player, { type: 'login' }, start + 7 * day);
  assert.equal(player.battle_pass.weekly.metrics.missions, undefined);
  assert.equal(player.battle_pass.season.metrics.missions, 10);
  const xp = player.battle_pass.xp;
  recordBattlePassEvent(player, { type: 'login' }, start + 28 * day);
  assert.equal(player.battle_pass.xp, xp);
  assert.equal(battlePassView(player, start + 28 * day).active, false);
});

test('all 28 days can earn the 9600 XP season cap and level 50 without manual claims', () => {
  const player = { level: 3 };
  for (let d = 0; d < 28; d++) {
    const now = start + d * day;
    recordBattlePassEvent(player, { type: 'login' }, now);
    for (let i = 0; i < 10; i++) recordBattlePassEvent(player, { type: 'mission', success: true, energy: 10, dm: 50 }, now);
    recordBattlePassEvent(player, { type: 'boss', damage: 20 }, now);
  }
  const view = battlePassView(player, start + 27 * day);
  assert.equal(view.xp, 9600);
  assert.equal(view.level, 50);
  assert.equal(view.tasks.season.every((task) => task.done), true);
  assert.equal(view.claims.length, 0);
  assert.equal(player.weapon_inventory, undefined);
});

test('claim is level/tier gated, idempotent, tickets separate and premium DM excluded', () => {
  const player = { level: 1 };
  recordBattlePassEvent(player, { type: 'login' }, start);
  assert.throws(() => claimBattlePassReward(player, { level: 1, track: 'free' }, start));
  player.battle_pass.xp = 7500;
  assert.throws(() => claimBattlePassReward(player, { level: 1, track: 'legendary' }, start));
  claimBattlePassReward(player, { level: 1, track: 'free' }, start);
  claimBattlePassReward(player, { level: 1, track: 'free' }, start);
  assert.equal(player.weapon_inventory['large-poison'], 1);
  player.battle_pass.tier = 'legendary';
  const xp = player.battle_pass.xp;
  claimBattlePassReward(player, { level: 2, track: 'legendary' }, start);
  assert.equal(player.battle_pass.season.metrics.dm, undefined);
  assert.equal(player.battle_pass.xp, xp);
  claimBattlePassReward(player, { level: 2, track: 'free' }, start);
  assert.equal(player.battle_pass.season.metrics.dm, 750);
  for (const track of ['free', 'epic', 'legendary']) claimBattlePassReward(player, { level: 40, track }, start);
  assert.equal(player.battle_pass.tickets, 1);
  assert.equal(player.roulette_bonus_spins, undefined);
  const roundTrip = JSON.parse(JSON.stringify(player));
  assert.equal(claimBattlePassReward(roundTrip, { level: 1, track: 'free' }, start), false);
  assert.throws(() => claimBattlePassReward(player, { level: 3, track: 'free' }, start + 28 * day));
});

test('purchases and forged profile counters cannot advance BP tasks', () => {
  const player = { level: 3, total_tasks_today: 10000, energy_spent_today: 10000, boss_hits_today: 10000, tentacles: 999999 };
  recordBattlePassEvent(player, { type: 'earnedDm', source: 'purchase', amount: 10000 }, start);
  assert.equal(player.battle_pass.xp, 0);
  assert.equal(player.battle_pass.season.metrics.dm, undefined);
  recordBattlePassEvent(player, { type: 'earnedDm', source: 'quest', amount: 10000 }, start);
  assert.equal(player.battle_pass.xp, 360);
});

test('boss victory BP XP is tiered, owner-event idempotent, capped at three per UTC day, and tracked as a task', () => {
  const player = { level: 10 };
  assert.deepEqual(recordBattlePassBossVictory(player, 'fight-a', 0, start), { awarded: true, xp: 10, killsToday: 1, limit: BP_BOSS_DAILY_LIMIT });
  assert.equal(recordBattlePassBossVictory(player, 'fight-a', 8, start).awarded, false);
  assert.deepEqual(recordBattlePassBossVictory(player, 'fight-b', 4, start), { awarded: true, xp: 20, killsToday: 2, limit: BP_BOSS_DAILY_LIMIT });
  assert.deepEqual(recordBattlePassBossVictory(player, 'fight-c', 8, start), { awarded: true, xp: 30, killsToday: 3, limit: BP_BOSS_DAILY_LIMIT });
  const capped = recordBattlePassBossVictory(player, 'fight-d', 8, start);
  assert.equal(capped.awarded, false);
  assert.equal(capped.killsToday, BP_BOSS_DAILY_LIMIT);
  assert.equal(player.battle_pass.xp, 60);
  assert.equal(battlePassView(player, start).tasks.daily.find((task) => task.metric === 'bossKills').done, true);
  assert.deepEqual(recordBattlePassBossVictory(player, 'fight-e', 2, start + day), { awarded: true, xp: 10, killsToday: 1, limit: BP_BOSS_DAILY_LIMIT });
  assert.equal(battlePassView(player, start + day).tasks.daily.find((task) => task.metric === 'bossKills').progress, 1);
});

test('production exposes the active season and honors explicit disable', () => {
  const previous = process.env.BATTLE_PASS_ENABLED;
  process.env.NODE_ENV = 'production';
  try {
    process.env.BATTLE_PASS_ENABLED = 'true';
    const player = {};
    recordBattlePassEvent(player, { type: 'login' }, start);
    assert.ok(player.battle_pass);
    assert.equal(battlePassView(player, start).active, true);
    process.env.BATTLE_PASS_ENABLED = 'false';
    assert.equal(battlePassView(player, start), null);
    assert.throws(() => claimBattlePassReward(player, { level: 1, track: 'free' }, start));
  } finally {
    process.env.NODE_ENV = 'test';
    if (previous === undefined) delete process.env.BATTLE_PASS_ENABLED;
    else process.env.BATTLE_PASS_ENABLED = previous;
  }
});

test('admin full unlock opens level 50, preserves claims and never downgrades Legendary', () => {
 const player = { level:3 };
 fullyUnlockBattlePass(player,'epic',start+day);
 assert.equal(battlePassView(player,start+day).level,50);
 assert.equal(player.battle_pass.tier,'epic');
 assert.equal(claimBattlePassReward(player,{level:5,track:'epic'},start+day),true);
 const claims = [...player.battle_pass.claims];
 fullyUnlockBattlePass(player,'legendary',start+day);
 fullyUnlockBattlePass(player,'epic',start+day);
 assert.equal(player.battle_pass.tier,'legendary');
 assert.deepEqual(player.battle_pass.claims,claims);
 assert.equal(claimBattlePassReward(player,{level:5,track:'epic'},start+day),false);
});
