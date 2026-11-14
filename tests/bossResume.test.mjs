import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';

process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) process.env[key] = '';
const [{ createApp }, { store }, { playerDb }] = await Promise.all([
  import('../server/app.js'), import('../server/data/store.js'), import('../server/data/player-db.js'),
]);

test('active boss is recovered for the same player and repeated spawn does not create a new fight', async () => {
  await store.init();
  await playerDb.init(store);
  const [player] = playerDb.attachPlayers([{ id: 'resume-player', telegram_id: '90101', created_by: 'telegram_90101@miniapp.local', level: 10, keycards: {}, weapon_cooldowns: {} }]);
  store.players = [player];
  store.bossFights = [];
  const server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const headers = { 'x-telegram-user-id': '90101', 'content-type': 'application/json' };
  try {
    const spawn = () => fetch(`${url}/boss-fights/spawn`, { method: 'POST', headers, body: JSON.stringify({ bossId: GAME_CONFIG.BOSSES[0].id }) }).then((response) => response.json());
    const first = (await spawn()).data;
    const resumed = (await (await fetch(`${url}/boss-fights/active`, { headers })).json()).data;
    const second = (await spawn()).data;
    assert.equal(first.id, resumed.id);
    assert.equal(first.id, second.id);
    assert.equal(store.bossFights.length, 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('a player can have only one active personal or clan-invited boss fight', async () => {
  await store.init();
  await playerDb.init(store);
  const [owner, player] = playerDb.attachPlayers([
    { id: 'clan-boss-owner', telegram_id: '90102', created_by: 'telegram_90102@miniapp.local', level: 10, clan_name: 'Test Clan', clan_id: 'test-clan', keycards: {}, weapon_cooldowns: {} },
    { id: 'clan-boss-player', telegram_id: '90103', created_by: 'telegram_90103@miniapp.local', level: 10, clan_name: 'Test Clan', clan_id: 'test-clan', keycards: {}, weapon_cooldowns: {} },
  ]);
  store.players = [owner, player];
  store.clans = [{ id: 'test-clan', name: 'Test Clan', owner_id: owner.id }];
  store.chatMessages = [];
  store.bossFights = [];
  const server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const headers = (telegramId) => ({ 'x-telegram-user-id': telegramId, 'content-type': 'application/json' });
  const post = async (path, telegramId, body = {}) => {
    const response = await fetch(`${url}${path}`, { method: 'POST', headers: headers(telegramId), body: JSON.stringify(body) });
    return { status: response.status, ...(await response.json()) };
  };
  try {
    const personal = await post('/boss-fights/spawn', '90103', { bossId: GAME_CONFIG.BOSSES[0].id });
    assert.equal(personal.status, 201);
    const inviteFight = {
      id: 'clan-invite-fight', boss_id: GAME_CONFIG.BOSSES[0].id, boss_name: 'Boss',
      status: 'active', current_hp: 100, max_hp: 100, opened_by_email: owner.created_by,
    };
    store.bossFights.push(inviteFight);
    store.chatMessages.push({
      id: 'clan-fight-invite', kind: 'boss_fight_invite', clan: 'Test Clan',
      bossFightInvite: { fightId: inviteFight.id }, created_at: new Date().toISOString(),
    });

    const rejectedJoin = await post(`/boss-fights/${inviteFight.id}/join`, '90103');
    assert.equal(rejectedJoin.status, 409);
    assert.equal(rejectedJoin.code, 'BOSS_FIGHT_ALREADY_ACTIVE');
    assert.deepEqual(inviteFight.invited_player_ids, undefined);
    assert.equal((await (await fetch(`${url}/boss-fights/active`, { headers: headers('90103') })).json()).data.id, personal.data.id);

    store.bossFights.find((fight) => fight.id === personal.data.id).status = 'dead';
    const joined = await post(`/boss-fights/${inviteFight.id}/join`, '90103');
    assert.equal(joined.status, 200);
    assert.ok(inviteFight.invited_player_ids.includes(String(player.id)));
    assert.equal((await (await fetch(`${url}/boss-fights/active`, { headers: headers('90103') })).json()).data.id, inviteFight.id);

    const rejectedSpawn = await post('/boss-fights/spawn', '90103', { bossId: GAME_CONFIG.BOSSES[0].id });
    assert.equal(rejectedSpawn.status, 409);
    assert.equal(rejectedSpawn.code, 'BOSS_FIGHT_ALREADY_ACTIVE');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
