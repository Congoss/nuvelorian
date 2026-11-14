import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) process.env[key] = '';
const { createApp } = await import('../server/app.js');
const { store } = await import('../server/data/store.js');
const { playerDb } = await import('../server/data/player-db.js');
const { paymentDb } = await import('../server/data/payment-db.js');
store.init = playerDb.init = paymentDb.init = async () => {};
store.persistSoon = () => {};
const flushes = [];
playerDb.flushDirtyPlayers = async ids => { flushes.push(ids); };

test('GO saves only the acting player and duplicate request cannot spend twice', async () => {
  store.players = playerDb.attachPlayers([{ id: 'mission-player', telegram_id: '90101',
    created_by: 'telegram_90101@miniapp.local', energy: 1160, max_energy: 130,
    last_energy_update: new Date().toISOString(), available_talent_points: 7,
    talent_points: 7, talent_tree_version: 2, level: 11, xp: 0 }]);
  const app = createApp();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.address().port}`;
  const headers = { 'x-telegram-user-id': '90101', 'content-type': 'application/json' };
  const body = { task: { id: 'p4-u00-scout', locationId: 'p4-u00' }, requestId: 'mission-retry-test-1' };
  const send = () => fetch(base + '/players/mission-player/tasks/complete', { method: 'POST', headers, body: JSON.stringify(body) });
  try {
    const first = await send();
    assert.equal(first.status, 200);
    const result = (await first.json()).data;
    assert.ok(result.player.energy < 1160 && result.player.energy > 130);
    assert.equal(result.player.available_talent_points, 7);
    assert.ok(flushes.some(ids => ids?.length === 1 && ids[0] === 'mission-player'));
    const repeated = await send();
    assert.equal(repeated.status, 200);
    const retry = (await repeated.json()).data;
    assert.equal(retry.player.energy, result.player.energy);
    assert.equal(retry.questProgress, result.questProgress);
  } finally {
    await new Promise(resolve => app.close(resolve));
  }
});

test('MAX completes a quest bar once with one request while database writes are blocked', async () => {
  store.players = playerDb.attachPlayers([{ id: 'batch-mission-player', telegram_id: '90103',
    created_by: 'telegram_90103@miniapp.local', energy: 1160, max_energy: 130,
    last_energy_update: new Date().toISOString(), level: 11, xp: 0 }]);
  const originalFlush = playerDb.flushDirtyPlayers;
  let unblock;
  const blocked = new Promise(resolve => { unblock = resolve; });
  playerDb.flushDirtyPlayers = () => blocked;
  const app = createApp();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const body = { task: { id: 'p4-u00-scout', locationId: 'p4-u00' }, count: 4, requestId: 'batch-mission-retry-1' };
  const send = value => fetch(`http://127.0.0.1:${app.address().port}/players/batch-mission-player/tasks/complete`, {
    method: 'POST', headers: { 'x-telegram-user-id': '90103', 'content-type': 'application/json' },
    body: JSON.stringify(value), signal: AbortSignal.timeout(2000),
  });
  try {
    for (const count of [0, -1, 1.5, '4', 5, 21]) {
      assert.equal((await send({ ...body, count })).status, 400);
    }
    assert.equal(store.players[0].energy, 1160);
    const response = await send(body);
    assert.equal(response.status, 200);
    const result = (await response.json()).data;
    assert.equal(result.completedCount, 4);
    assert.equal(result.questProgress, 4);
    assert.equal(result.spentEnergy, 12);
    assert.equal(result.player.energy, 1148);
    const retry = (await (await send(body)).json()).data;
    assert.equal(retry.player.energy, 1148);
    assert.equal(retry.questProgress, 4);
  } finally {
    unblock(); playerDb.flushDirtyPlayers = originalFlush;
    await new Promise(resolve => app.close(resolve));
  }
});
