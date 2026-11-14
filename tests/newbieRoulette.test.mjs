import assert from 'node:assert/strict';
import test from 'node:test';
import { getNewbieProgress, isNewbieQuestComplete } from '../src/lib/newbieQuest.js';
import { getQuestRewardNotifications } from '../src/lib/questNotifications.js';

process.env.NODE_ENV = 'test';
// Never connect these integration tests to a configured developer database.
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) {
  process.env[key] = '';
}
const [{ createApp }, { store }, { playerDb }] = await Promise.all([
  import('../server/app.js'),
  import('../server/data/store.js'),
  import('../server/data/player-db.js'),
]);

test('roulette quest accepts recorded spins, including legacy spins, but not unused bonus spins', () => {
  assert.equal(isNewbieQuestComplete({}, 16), false);
  assert.equal(isNewbieQuestComplete({ roulette_bonus_spins: 5 }, 16), false);
  assert.equal(isNewbieQuestComplete({ newbie_stats: { roulette_spins: 1 } }, 16), true);
  const profile = {
    newbie_stats: { roulette_spins: 0 },
    roulette_last_reward_id: 'tentacles',
    newbie_claimed_parts: [1, 2, 3],
    newbie_claimed_quests: Array.from({ length: 15 }, (_, index) => index + 1),
  };
  const progress = getNewbieProgress(profile);
  assert.equal(progress.activePart.id, 4);
  assert.equal(progress.activeQuest.id, 16);
  assert.equal(progress.activeQuest.done, true);
  assert.equal(progress.activeQuest.claimed, false);
  assert.equal(getQuestRewardNotifications(profile).newbie, true);
  profile.newbie_claimed_quests.push(16);
  assert.equal(getNewbieProgress(profile).activeQuest.id, 17);
  assert.equal(getQuestRewardNotifications(profile).newbie, false);
});

test('free, bonus and paid spins count once; rejected spins and reward claims do not count', async () => {
  await store.init();
  await playerDb.init(store);
  const [player] = playerDb.attachPlayers([{
    id: 'roulette-test-player',
    created_by: 'telegram_90001@miniapp.local',
    telegram_id: '90001',
    level: 5,
    premium: 5,
    roulette_bonus_spins: 1,
    newbie_stats: { hero_views: 7 },
  }]);
  store.players = [player];
  const server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const patch = async (body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/players/${player.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-telegram-user-id': '90001' },
      body: JSON.stringify(body),
    });
    return { ok: response.ok, ...(await response.json()) };
  };
  try {
    let expected = 0;
    for (const spinType of ['free', 'bonus', 'paid']) {
      const result = await patch({ spinRoulette: { spinType } });
      assert.equal(result.ok, true);
      expected += 1;
      assert.equal(result.data.player.newbie_stats.roulette_spins, expected);
      assert.equal(result.data.player.newbie_stats.hero_views, 7);
      assert.equal(isNewbieQuestComplete(result.data.player, 16), true);
      const rejected = await patch({ spinRoulette: { spinType } });
      assert.equal(rejected.ok, false);
      assert.equal(player.newbie_stats.roulette_spins, expected);
      assert.equal((await patch({ claimRouletteReward: { pendingId: player.roulette_pending_reward.pendingId } })).ok, true);
    }
    const claim = await patch({ claimRouletteReward: { pendingId: "already-claimed" } });
    assert.equal(claim.ok, true);
    assert.equal(player.newbie_stats.roulette_spins, 3);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});


test('ten draws consume exact cost, preserve pending results and claim every reward exactly once', async () => {
  const player = { id: 'batch-player', telegram_id: '90002', created_by: 'telegram_90002@miniapp.local', level: 29, premium: 50, roulette_bonus_spins: 10, energy: 1000 };
  store.players = playerDb.attachPlayers([player]);
  const current = store.players[0];
  const server = createApp();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const patch = async body => {
    const r = await fetch('http://127.0.0.1:' + server.address().port + '/players/batch-player', { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-telegram-user-id': '90002' }, body: JSON.stringify(body) });
    return { ok: r.ok, ...(await r.json()) };
  };
  try {
    for (const count of [0, 2, 11, '10']) assert.equal((await patch({ spinRoulette: { spinType: 'paid', count } })).ok, false);
    assert.equal(current.premium, 50);
    for (const spinType of ['free', 'bonus', 'paid']) {
      const denied = await patch({ spinRoulette: { spinType, count: 10 } });
      assert.equal(denied.ok, false);
      assert.equal(denied.code, 'ROULETTE_LEVEL_REQUIRED');
    }
    assert.equal(current.premium, 50);
    assert.equal(current.roulette_bonus_spins, 10);
    assert.equal(current.roulette_pending_reward, undefined);
    current.level = 30;
    for (const spinType of ['bonus', 'paid', 'free']) {
      current.roulette_bonus_spins = spinType === 'free' ? 9 : 10;
      const result = await patch({ spinRoulette: { spinType, count: 10 } });
      assert.equal(result.ok, true);
      const pending = result.data.pending_reward;
      assert.equal(pending.rewards.length, 10);
      assert.equal(current.roulette_bonus_spins, spinType === 'paid' ? 10 : 0);
      if (spinType === 'paid') assert.equal(current.premium, 0);
      assert.equal((await patch({ spinRoulette: { spinType: 'bonus', count: 10 } })).ok, false);
      assert.equal(current.roulette_pending_reward.pendingId, pending.pendingId);
      const { applyRouletteReward } = await import('../src/lib/rouletteRewards.js');
      const expected = JSON.parse(JSON.stringify(current));
      for (const reward of pending.rewards) applyRouletteReward(expected, reward);
      assert.equal((await patch({ claimRouletteReward: { pendingId: 'wrong-id' } })).ok, false);
      assert.equal((await patch({ claimRouletteReward: { pendingId: pending.pendingId } })).ok, true);
      assert.equal(current.energy, expected.energy);
      assert.equal(current.roulette_bonus_spins, expected.roulette_bonus_spins);
      assert.deepEqual(current.weapon_inventory, expected.weapon_inventory);
      const after = JSON.parse(JSON.stringify({ energy: current.energy, weapons: current.weapon_inventory || {}, spins: current.roulette_bonus_spins }));
      assert.equal((await patch({ claimRouletteReward: { pendingId: pending.pendingId } })).ok, true);
      assert.deepEqual({ energy: current.energy, weapons: current.weapon_inventory || {}, spins: current.roulette_bonus_spins }, after);
    }
    assert.equal(current.newbie_stats.roulette_spins, 30);
    current.roulette_bonus_spins = 0;
    assert.equal((await patch({ spinRoulette: { spinType: 'bonus', count: 10 } })).ok, false);
    assert.equal((await patch({ spinRoulette: { spinType: 'paid', count: 10 } })).ok, false);
    assert.equal(current.newbie_stats.roulette_spins, 30);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

