import test from 'node:test';
import assert from 'node:assert/strict';
import { getClanDonationState } from '../src/lib/clanDonationState.js';
process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING']) process.env[key] = '';
const { createApp } = await import('../server/app.js');
const { store } = await import('../server/data/store.js');
const { playerDb } = await import('../server/data/player-db.js');
const { paymentDb } = await import('../server/data/payment-db.js');
store.init = playerDb.init = paymentDb.init = async () => {};
store.persistSoon = () => {};
const saved = [];
playerDb.flushDirtyPlayers = async ids => { if (ids) saved.push(ids); };

test('donation limits remain available before clan details finish loading', () => {
  const profile = { clan_id: 'c1', clan_donation_contributions: { c1: { 1: 100 } } };
  assert.equal(getClanDonationState(profile, null).contribution_cap, 2500);
  assert.equal(getClanDonationState(profile, null).contribution, 0, 'legacy lifetime contribution does not block the new timed cap');
  profile.clan_donation_limits = { c1: { 1: { used: 100, available_at: new Date(Date.now() + 1000).toISOString() } } };
  assert.equal(getClanDonationState(profile, null).contribution, 100);
  assert.equal(getClanDonationState(profile, null, Date.now() + 1001).contribution, 0);
  assert.equal(getClanDonationState(profile, { id: 'c1', achievements: { donations: { progress: 25000 } } }).contribution_cap, 7500);
});

test('clan donation persists balance and contributions; retries cannot charge twice', async () => {
  store.players = playerDb.attachPlayers([{ id: 'donor', telegram_id: '90101', created_by: 'telegram_90101@miniapp.local',
    clan_id: 'c1', clan_name: 'Test clan', tentacles: 10000, level: 11, energy: 100 }]);
  store.clans = [{ id: 'c1', name: 'Test clan', achievements: { donations: { progress: 0 } } }];
  const app = createApp();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.address().port}`;
  const send = (body) => fetch(base + '/clans/c1/donations', { method: 'POST', headers: { 'x-telegram-user-id': '90101', 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  try {
    const body = { amount: 2500, actionId: 'donation-retry-test' };
    const first = await send(body);
    assert.equal(first.status, 200);
    const result = (await first.json()).data;
    assert.equal(result.counted, 2500);
    assert.equal(result.player.clan_donation_contributions.c1[1], 2500);
    assert.equal(Date.parse(result.available_at), now + 12 * 60 * 60 * 1000);
    assert.ok(saved.some(ids => ids[0] === 'donor'));
    const balance = store.players[0].tentacles;
    const retry = await send(body);
    assert.equal(retry.status, 200);
    assert.equal((await retry.json()).data.duplicate, true);
    assert.equal(store.players[0].tentacles, balance);
    assert.equal(store.clans[0].achievements.donations.progress, 2500);
    const blocked = await send({ amount: 1, actionId: 'blocked-before-refresh' });
    assert.equal(blocked.status, 409);
    now += 12 * 60 * 60 * 1000 + 1;
    const refreshed = await send({ amount: 2500, actionId: 'donation-after-refresh' });
    assert.equal(refreshed.status, 200);
    assert.equal((await refreshed.json()).data.counted, 2500);
    assert.equal(store.clans[0].achievements.donations.progress, 5000);
  } finally { Date.now = originalNow; await new Promise(resolve => app.close(resolve)); }
});
