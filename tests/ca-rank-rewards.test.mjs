import test from 'node:test';
import assert from 'node:assert/strict';
import { getPendingCARankRewards, getCARankReward } from '../src/lib/caRankRewards.js';

process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) process.env[key] = '';

const [{ createApp }, { store }, { playerDb }, { paymentDb }, { buildBootstrapPayload }] = await Promise.all([
  import('../server/app.js'),
  import('../server/data/store.js'),
  import('../server/data/player-db.js'),
  import('../server/data/payment-db.js'),
  import('../server/utils/bootstrap.js'),
]);

store.init = playerDb.init = paymentDb.init = async () => {};
store.persistSoon = () => {};
playerDb.flushDirtyPlayers = async () => {};

test('CA rank rewards queue in order and server claims once after reaching rank', async () => {
  assert.deepEqual(getPendingCARankRewards({ stat_strength: 350, ca_rank_rewards_claimed: [2] }), [3]);
  assert.deepEqual(getPendingCARankRewards({ stat_strength: 50 }), []);

  const [player] = playerDb.attachPlayers([{
    id: 'ca-rank-player', telegram_id: '90772', created_by: 'telegram_90772@miniapp.local',
    level: 1, stat_strength: 100, energy: 40, max_energy: 100, tentacles: 20, weapon_inventory: {}, roulette_bonus_spins: 0,
  }]);
  let persistedPlayer = null;
  playerDb.flushDirtyPlayers = async () => {
    // Exercise the exact player/progression payload serialized by PostgreSQL writes.
    const record = playerDb.toDbPlayerRecord(player);
    persistedPlayer = playerDb.fromDbPlayerRecord(record);
  };
  store.players = [player];
  const app = createApp();
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${app.address().port}/players/${player.id}`;
  const claim = (rank) => fetch(url, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-telegram-user-id': '90772' },
    body: JSON.stringify({ claimCARankReward: { rank } }),
  });
  try {
    assert.equal((await claim(3)).status, 400);
    const concurrentClaims = await Promise.all([claim(2), claim(2)]);
    assert.deepEqual(concurrentClaims.map(({ status }) => status).sort(), [200, 409]);
    const response = concurrentClaims.find(({ status }) => status === 200);
    assert.equal(response.status, 200);
    const result = (await response.json()).data;
    assert.equal(result.claimedCARank, 2);
    assert.deepEqual(result.ca_rank_rewards_claimed, [2]);
    assert.equal(result.tentacles, 1020);
    assert.equal(result.energy, 70);
    assert.equal(result.weapon_inventory['small-poison'], 5);
    assert.deepEqual(persistedPlayer.ca_rank_rewards_claimed, [2]);
    assert.equal(persistedPlayer.tentacles, 1020);
    assert.ok(persistedPlayer.energy >= 70 && persistedPlayer.energy < 70.01);
    assert.equal(persistedPlayer.weapon_inventory['small-poison'], 5);
    assert.deepEqual(getPendingCARankRewards(persistedPlayer), []);

    assert.equal((await claim(2)).status, 409);
    assert.equal(player.tentacles, 1020);
    const bootstrap = buildBootstrapPayload(player).bootstrap;
    assert.deepEqual(bootstrap.progression.ca_rank_rewards_claimed, [2]);
    assert.deepEqual(bootstrap.player.ca_rank_rewards_claimed, [2]);
    player.stat_strength=2560000;
    player.ca_rank_rewards_claimed=Array.from({length:14},(_,i)=>i+2);
    const balanceBefore=player.tentacles,poisonBefore=Number(player.weapon_inventory['large-poison']||0);
    for(const rank of [16,17,18,19]){
      assert.equal((await claim(rank)).status,200);
      assert.equal((await claim(rank)).status,409);
    }
    assert.equal(player.tentacles-balanceBefore,[16,17,18,19].reduce((sum,rank)=>sum+getCARankReward(rank).tentacles,0));
    assert.equal(player.weapon_inventory['large-poison']-poisonBefore,1350);
    assert.deepEqual(getPendingCARankRewards(player),[]);
    assert.deepEqual(persistedPlayer.ca_rank_rewards_claimed,Array.from({length:18},(_,i)=>i+2));

  } finally {
    await new Promise((resolve) => app.close(resolve));
  }
});
