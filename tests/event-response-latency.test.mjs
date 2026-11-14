import test from 'node:test';
import assert from 'node:assert/strict';
import { POISON_SHOP } from '../src/lib/eventPoisonShop.js';

process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) process.env[key] = '';
const {createApp} = await import('../server/app.js');
const {store} = await import('../server/data/store.js');
const {playerDb} = await import('../server/data/player-db.js');
const {paymentDb} = await import('../server/data/payment-db.js');
store.init = playerDb.init = paymentDb.init = async () => {};
store.persistSoon = () => {};

test('event purchase returns its player snapshot without waiting for SQL and cannot double spend', async () => {
  const originalNow = Date.now;
  Date.now = () => Date.parse(POISON_SHOP.startAt) + 1000;
  store.players = playerDb.attachPlayers([{id:'event-latency', telegram_id:'90104',
    created_by:'telegram_90104@miniapp.local', level:11, tentacles:1000000000}]);
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  playerDb.flushDirtyPlayers = () => blocked;
  const app = createApp();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const send = () => fetch(`http://127.0.0.1:${app.address().port}/events/poison-shop/buy`, {
    method:'POST', headers:{'x-telegram-user-id':'90104', 'content-type':'application/json'},
    body:JSON.stringify({productId:'large', quantity:1, requestId:'event-latency-request-1'}),
    signal:AbortSignal.timeout(2000),
  });
  try {
    const first = await send();
    assert.equal(first.status, 200);
    const result = (await first.json()).data;
    assert.equal(result.player.weapon_inventory['large-poison'], 1);
    assert.ok(result.player.tentacles < 1000000000);
    const retry = await send();
    assert.equal(retry.status, 200);
    const repeated = (await retry.json()).data;
    assert.equal(repeated.player.tentacles, result.player.tentacles);
    assert.equal(repeated.player.weapon_inventory['large-poison'], 1);
  } finally {
    release(); Date.now = originalNow;
    await new Promise(resolve => app.close(resolve));
  }
});
