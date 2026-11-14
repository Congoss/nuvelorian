import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { KeyPair } from '@near-js/crypto';
import { serializeNep413 } from '@near-wallet-selector/core';
process.env.NODE_ENV = 'test';
process.env.WEB_SESSION_SECRET = 'web-guest-test';
process.env.NEAR_WALLET_RPC_URL = 'https://login-rpc.test/';
const { createWebAuth, isGuestId } = await import('../server/utils/webAuth.js');
const { applyPlayerAction } = await import('../server/utils/playerActions.js');
const { canSpendTutorialEnergyOnMission } = await import('../src/lib/tutorialProgress.js');

test('guest cookies are signed, last 30 days and map to a guest email', () => {
  let clock = 1000;
  const auth = createWebAuth({ secret: 's', secure: false, now: () => clock });
  const guestId = auth.createGuestId();
  assert.ok(isGuestId(guestId));
  const cookie = auth.createSession({ telegramId: '', guestId, username: 'g' });
  assert.match(cookie, /Max-Age=2592000/);
  const headers = { cookie: cookie.split(';')[0] };
  const session = auth.session(headers);
  assert.equal(session.guest, true);
  assert.equal(session.email, `guest_${guestId}@miniapp.local`);
  assert.equal(session.telegramId, '');
  assert.throws(() => auth.createSession({ guestId: 'bad' }));
  const tampered = headers.cookie.replace(/\.[^.]+$/, '.AAAA');
  assert.equal(auth.session({ cookie: tampered }), null);
  clock += 31 * 86400000;
  assert.equal(auth.session(headers), null);
});

test('skipping the guide keeps starter energy once and unblocks missions', () => {
  const player = { id: 'p', level: 1, energy: 10, tutorial_step: 'welcome' };
  assert.equal(canSpendTutorialEnergyOnMission(player, 'any'), false);
  applyPlayerAction(player, { type: 'tutorial-skip' });
  assert.equal(player.tutorial_disabled, true);
  assert.equal(player.energy, 141);
  assert.equal(canSpendTutorialEnergyOnMission(player, 'any'), true);
  applyPlayerAction(player, { type: 'tutorial-skip' });
  assert.equal(player.energy, 141);
});

const key = KeyPair.fromRandom('ed25519');
function proof(data, accountId) {
  const serialized = serializeNep413({ message: data.message, nonce: Buffer.from(data.nonce, 'base64'), recipient: data.recipient });
  return { challengeId: data.challengeId, signedMessage: { accountId, publicKey: key.getPublicKey().toString(), signature: Buffer.from(key.sign(createHash('sha256').update(serialized).digest()).signature).toString('base64') } };
}

test('HTTP guest play: same-origin only, rate limited, skip option, upgrade to NEAR keeps the same player', async () => {
  const [{ createApp }, { store }, { playerDb }, { paymentDb }] = await Promise.all([import('../server/app.js'), import('../server/data/store.js'), import('../server/data/player-db.js'), import('../server/data/payment-db.js')]);
  store.init = playerDb.init = paymentDb.init = async () => {}; store.persistSoon = () => {}; store.persistNow = async () => {}; playerDb.flushDirtyPlayers = async () => {};
  store.players = playerDb.attachPlayers([]);
  const realFetch = global.fetch;
  global.fetch = async (url, options) => String(url) === 'https://login-rpc.test/' ? { ok: true, json: async () => ({ result: { permission: 'FullAccess' } }) } : realFetch(url, options);
  const server = createApp(); await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port;
  const post = (route, body = {}, cookie = '', origin = base, ip = '10.0.0.1') => fetch(base + '/api/auth/web/' + route, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie, 'X-Forwarded-For': ip }, body: JSON.stringify(body) });
  try {
    assert.equal((await post('guest', {}, '', 'https://evil.test')).status, 403);
    let res = await post('guest', { skipTutorial: true, language: 'en' });
    assert.equal(res.status, 200);
    const guestCookie = res.headers.get('set-cookie').split(';')[0];
    res = await fetch(base + '/api/players/me', { headers: { Cookie: guestCookie } });
    assert.equal(res.status, 200);
    const me = (await res.json()).data;
    assert.equal(store.players.length, 1);
    assert.equal(store.players[0].guest_account, true);
    assert.equal(store.players[0].tutorial_disabled, true);
    assert.equal(me.id, store.players[0].id);
    // repeat with an existing session does not create another account
    assert.equal((await post('guest', {}, guestCookie)).status, 200);
    assert.equal(store.players.length, 1);
    // view-only market: a guest may look at it but cannot trade; no session or a Telegram client gets nothing
    const { mainnetMarket } = await import('../server/services/market-mainnet-store.js');
    const saved = { pilot: process.env.MARKET_MAINNET_PILOT, isReady: mainnetMarket.isReady, readPublic: mainnetMarket.readPublic };
    process.env.MARKET_MAINNET_PILOT = '1';
    mainnetMarket.isReady = () => true;
    mainnetMarket.readPublic = async player => ({ readOnly: true, lots: [], viewer: player.id });
    try {
      const market = (path, init = {}) => fetch(base + '/api/market-pilot' + path, { ...init, headers: { Origin: base, 'Content-Type': 'application/json', 'X-Local-Market-Platform': 'web', ...(init.headers || {}) } });
      res = await market('/access', { headers: { Cookie: guestCookie } });
      let access = (await res.json()).data;
      assert.deepEqual([access.allowed, access.view], [false, true]);
      res = await market('', { headers: { Cookie: guestCookie } });
      assert.equal(res.status, 200);
      const seen = (await res.json()).data;
      assert.deepEqual([seen.readOnly, seen.viewer], [true, me.id]);
      for (const [path, body] of [['', { action: 'reserve', lotId: 'x' }], ['', { action: 'list' }], ['', { action: 'npc' }], ['/instruction', { orderId: 'x' }], ['/registration', {}]]) {
        res = await market(path, { method: 'POST', headers: { Cookie: guestCookie }, body: JSON.stringify(body) });
        assert.equal(res.status, 403, 'guest POST ' + path);
        assert.equal((await res.json()).code, 'MARKET_ACCESS_DENIED');
      }
      assert.equal((await market('')).status, 403, 'no session');
      access = (await (await market('/access')).json()).data;
      assert.deepEqual([access.allowed, access.view], [false, false]);
      assert.equal((await market('', { headers: { Cookie: guestCookie, 'X-Telegram-Init-Data': 'x' } })).status, 403, 'Telegram client');
      process.env.MARKET_MAINNET_PILOT = '0';
      assert.equal((await market('', { headers: { Cookie: guestCookie } })).status, 403, 'pilot switched off');
    } finally {
      mainnetMarket.isReady = saved.isReady; mainnetMarket.readPublic = saved.readPublic;
      if (saved.pilot === undefined) delete process.env.MARKET_MAINNET_PILOT; else process.env.MARKET_MAINNET_PILOT = saved.pilot;
    }
    // per-address limit (3/hour)
    assert.equal((await post('guest', {}, '', base, '10.0.0.2')).status, 200);
    assert.equal((await post('guest', {}, '', base, '10.0.0.2')).status, 200);
    assert.equal((await post('guest', {}, '', base, '10.0.0.2')).status, 200);
    assert.equal((await post('guest', {}, '', base, '10.0.0.2')).status, 429);
    // upgrade: NEAR sign-in while playing as guest keeps the same player
    res = await post('near/challenge', {}, guestCookie);
    const binding = res.headers.get('set-cookie').split(';')[0];
    const body = proof((await res.json()).data, 'judge.near');
    res = await post('near/verify', body, `${guestCookie}; ${binding}`);
    assert.equal(res.status, 200);
    const walletCookie = res.headers.get('set-cookie').split(';')[0];
    const upgraded = store.players.find(p => p.id === me.id);
    assert.equal(upgraded.guest_account, false);
    assert.equal(upgraded.near_wallet_id, 'judge.near');
    assert.equal(upgraded.created_by, 'near_judge.near@miniapp.local');
    res = await fetch(base + '/api/players/me', { headers: { Cookie: walletCookie } });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).data.id, me.id);
    // open trading: any verified NEAR wallet can trade now, not only the original invited testers.
    // judge.near has no telegram_id at all, so the old allowlist (hasMarketAccess) would have refused it.
    assert.equal(upgraded.near_wallet_verified, true);
    {
      const { mainnetMarket } = await import('../server/services/market-mainnet-store.js');
      const saved2 = { pilot: process.env.MARKET_MAINNET_PILOT, isReady: mainnetMarket.isReady };
      process.env.MARKET_MAINNET_PILOT = '1';
      mainnetMarket.isReady = () => true;
      try {
        res = await fetch(base + '/api/market-pilot/access', { headers: { Cookie: walletCookie, Origin: base } });
        assert.equal((await res.json()).data.allowed, true);
        assert.ok(!upgraded.telegram_id, 'no Telegram ID, so the old allowlist never matched this player');
      } finally {
        mainnetMarket.isReady = saved2.isReady;
        if (saved2.pilot === undefined) delete process.env.MARKET_MAINNET_PILOT; else process.env.MARKET_MAINNET_PILOT = saved2.pilot;
      }
    }
    // a valid guest cookie whose player record is gone comes back as a guest, not as a regular account
    const { webAuth } = await import('../server/utils/webAuth.js');
    const lostId = webAuth.createGuestId();
    const lostCookie = webAuth.createSession({ telegramId: '', guestId: lostId, username: 'lost' }).split(';')[0];
    res = await fetch(base + '/api/players/bootstrap', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', Cookie: lostCookie }, body: '{}' });
    assert.equal(res.status, 200);
    const restored = store.players.find(p => p.created_by === `guest_${lostId}@miniapp.local`);
    assert.equal(restored?.guest_account, true);
    assert.match(restored.nickname, /^Guest [A-Z0-9_-]{4}$/);
    // public stats exclude guests and work without the indexer
    global.fetch = async (url, options) => String(url).includes('nearblocks') ? { ok: false, json: async () => ({}) } : realFetch(url, options);
    res = await fetch(base + '/api/public/stats');
    assert.equal(res.status, 200);
    const stats = (await res.json()).data;
    assert.equal(stats.players, 1);
    assert.equal(stats.walletPlayers, 1);
    assert.deepEqual(stats.recent, []);
    // market totals: absent while the pilot is off, passed through when it is on, never fatal when it fails
    assert.equal(stats.market, null);
    const realStats = mainnetMarket.publicStats;
    try {
      mainnetMarket.publicStats = async () => ({ trades: 2, volumeHundredths: 700, activeLots: 3, recent: [] });
      assert.deepEqual((await (await fetch(base + '/api/public/stats')).json()).data.market, { trades: 2, volumeHundredths: 700, activeLots: 3, recent: [] });
      mainnetMarket.publicStats = async () => { throw new Error('database down'); };
      res = await fetch(base + '/api/public/stats');
      assert.equal(res.status, 200);
      assert.equal((await res.json()).data.market, null);
    } finally { mainnetMarket.publicStats = realStats; }
  } finally { global.fetch = realFetch; await new Promise(r => server.close(r)); }
});
