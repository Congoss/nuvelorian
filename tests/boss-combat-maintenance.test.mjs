import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';
import { EVENT_SCHEDULE } from '../src/lib/eventSchedule.js';
import { attackShipFight, ensureShip, openShipFight } from '../server/utils/clanShip.js';

process.env.NODE_ENV = 'test';
process.env.LOCAL_GAME_STATE_PATH = '';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) process.env[key] = '';
const [{ createApp }, { store }, { playerDb }, { paymentDb }] = await Promise.all([
  import('../server/app.js'), import('../server/data/store.js'),
  import('../server/data/player-db.js'), import('../server/data/payment-db.js'),
]);
store.init = playerDb.init = paymentDb.init = async () => {};
store.persistSoon = () => {};
playerDb.flushDirtyPlayers = async () => 0;

test('personal and raid hits consume poison without social maintenance; profile refresh still updates referrals', async () => {
  const originalNow = Date.now;
  Date.now = () => Date.parse(EVENT_SCHEDULE['raid-boss'].startAt) + 1000;
  const players = playerDb.attachPlayers([
    { id: 'maintenance-attacker', telegram_id: '90529', created_by: 'telegram_90529@miniapp.local',
      level: 20, talent_tree_version: 2, referral_code: 'maintenance-code', weapon_inventory: { 'small-poison': 2 },
      weapon_cooldowns: {}, referred_friends: [{ playerId: 'maintenance-friend', level: 1, status: 'joined' }] },
    { id: 'maintenance-friend', telegram_id: '90530', level: 20, referred_by: 'maintenance-code' },
  ]);
  store.players = players;
  const [player] = players;
  store.bossFights = [{ id: 'maintenance-fight', boss_id: GAME_CONFIG.BOSSES[0].id, status: 'active',
    max_hp: 100000, current_hp: 100000, started_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 86400000).toISOString(), opened_by_email: player.created_by }];
  store.bossDamageLogs = [];
  store.raidBoss = { id: 'maintenance-raid', status: 'active', current_hp: 100000, max_hp: 100000, participants: {} };
  const app = createApp();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.address().port}`;
  const headers = { 'x-telegram-user-id': '90529', 'content-type': 'application/json' };
  try {
    const damage = [];
    for (const endpoint of ['/boss-fights/maintenance-fight/attack', '/raid-boss/attack']) {
      player.weapon_cooldowns = {};
      const response = await fetch(base + endpoint, { method: 'POST', headers,
        body: JSON.stringify({ weaponId: 'satchel' }), signal: AbortSignal.timeout(2000) });
      const result = await response.json();
      assert.equal(response.status, 200, JSON.stringify(result));
      for (const stage of ['select', 'locks', 'queue', 'prepare', 'commit', 'publish']) {
        assert.match(response.headers.get('server-timing'), new RegExp(`combat_${stage};dur=\\d+`));
      }
      assert.ok(result.data.hit.damage > 0);
      damage.push(result.data.hit.damage);
      assert.equal(player.referred_friends[0].level, 1, 'Combat must not refresh unrelated referral profiles');
    }
    assert.equal(player.weapon_inventory['small-poison'], 0);
    const shipPlayer = { ...player, weapon_inventory: { 'small-poison': 1 }, weapon_cooldowns: {} };
    const clan = { id: 'parity-clan', name: 'Parity' };
    ensureShip(clan).progress.hull = 100000000;
    const opened = openShipFight(clan, shipPlayer, { moduleId: 'hull', requestId: 'parity-open-request' });
    const shipHit = attackShipFight(clan, shipPlayer, [shipPlayer], {
      moduleId: 'hull', fightId: opened.fightId, requestId: 'parity-hit-request', weaponId: 'satchel',
    });
    assert.deepEqual(damage, [shipHit.damage, shipHit.damage]);
    assert.equal(shipPlayer.weapon_inventory['small-poison'], 0);
    const refresh = await fetch(base + '/players/me', { headers });
    const result = await refresh.json();
    assert.equal(refresh.status, 200, JSON.stringify(result));
    assert.equal(result.data.referred_friends[0].level, 20);
    assert.equal(result.data.referred_friends[0].status, 'reward_ready');
  } finally {
    Date.now = originalNow;
    await new Promise(resolve => app.close(resolve));
  }
});
