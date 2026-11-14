import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

process.env.NODE_ENV = 'test';
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
process.env.WEB_SESSION_SECRET = 'test-web-secret';
const { createApp } = await import('../server/app.js');
const { store } = await import('../server/data/store.js');
const { playerDb } = await import('../server/data/player-db.js');
store.init = playerDb.init = async () => {};
store.persistSoon = () => {};
playerDb.flushDirtyPlayers = async () => {};
store.players = playerDb.attachPlayers([
  { id: 'duelist-1', telegram_id: '501', created_by: 'telegram_501@miniapp.local', username: 'one', level: 10 },
  { id: 'duelist-2', telegram_id: '502', created_by: 'telegram_502@miniapp.local', username: 'two', level: 10 },
]);

function initData(id, username) {
  const params = new URLSearchParams({ auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify({ id, username }) });
  const text = [...params].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();
  params.set('hash', createHmac('sha256', secret).update(text).digest('hex'));
  return params.toString();
}

test('/pvp: auth required, two players never see or affect each other, a finished match reflects in standings', async () => {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const pvp = (id, username, body) => fetch(base + '/api/pvp', { method: body ? 'POST' : 'GET', headers: { 'X-Telegram-Init-Data': initData(id, username), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    assert.equal((await fetch(base + '/api/pvp')).status, 401, 'no session');

    let res = await pvp(501, 'one');
    assert.equal(res.status, 200);
    let body = await res.json();
    assert.equal(body.data.match, null);
    assert.equal(body.data.progress.attempts, 5);

    res = await pvp(501, 'one', { action: 'start', preset: { set: 'cardboard_survivor', enhancement: 0, talents: 0 } });
    assert.equal(res.status, 200);
    let match = (await res.json()).data.match;
    assert.equal(match.status, 'active');
    const matchId = match.id;

    // a second, unrelated player gets their own independent state
    res = await pvp(502, 'two');
    assert.equal((await res.json()).data.match, null, 'second player has no match of the first player');

    // play out the whole duel with the always-winning move against a known bot, or abandon if it takes too long
    let rounds = 0, finished = null;
    while (rounds < 60 && !finished) {
      rounds++;
      res = await pvp(501, 'one', { action: 'choose', matchId, round: match.round, choice: 'finger' });
      assert.equal(res.status, 200, 'round ' + rounds);
      match = (await res.json()).data.match;
      if (match.status === 'finished') finished = match;
    }
    assert.ok(finished, 'match finished within 60 rounds');
    assert.ok(['win', 'loss', 'draw'].includes(finished.result));

    res = await pvp(501, 'one');
    body = await res.json();
    assert.equal(body.data.match.id, matchId);
    assert.equal(body.data.match.status, 'finished');
    assert.ok(body.data.progress.history.some(h => h.id === matchId));

    // a stale/unknown match id is refused, not silently accepted
    res = await pvp(501, 'one', { action: 'choose', matchId: 'does-not-exist', round: 1, choice: 'finger' });
    assert.equal(res.status, 409);
    const errorBody = await res.json();
    assert.ok(errorBody.code);
    assert.ok(errorBody.details?.progress, 'error responses still carry standings for the UI');

    // abandon on a fresh match clears it without touching the other player
    res = await pvp(501, 'one', { action: 'start', preset: { set: 'cardboard_survivor', enhancement: 0, talents: 0 } });
    const second = (await res.json()).data.match;
    res = await pvp(501, 'one', { action: 'abandon' });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).data.match, null);
    res = await pvp(502, 'two');
    assert.equal((await res.json()).data.match, null, 'player two unaffected throughout');
    assert.notEqual(second.id, matchId);
  } finally {
    server.close();
  }
});
