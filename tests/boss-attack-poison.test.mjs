import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';

process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) process.env[key] = '';
const [{ createApp }, { store }, { playerDb }] = await Promise.all([
  import('../server/app.js'), import('../server/data/store.js'), import('../server/data/player-db.js'),
]);

test('small poison boss attack applies damage and consumes exactly one dose', async () => {
  await store.init();
  await playerDb.init(store);
  const [player] = playerDb.attachPlayers([{
    id: 'boss-attack-poison-player',
    telegram_id: '90520',
    created_by: 'telegram_90520@miniapp.local',
    level: 10,
    weapon_inventory: { 'small-poison': 2 },
    weapon_cooldowns: {},
    talent_tree_version: 2,
    talent_levels: { t35: 1 },
    talent_combat_state: {},
  }]);
  store.players = [player];
  store.bossFights = [{
    id: 'boss-attack-poison-fight',
    boss_id: GAME_CONFIG.BOSSES[0].id,
    status: 'active',
    current_hp: 10000,
    max_hp: 10000,
    started_at: new Date().toISOString(),
    opened_by_email: player.created_by,
  }];
  store.bossDamageLogs = [];
  const server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const originalFlush = playerDb.flushDirtyPlayers;
  let release;
  const blockedWrite = new Promise(resolve => { release = resolve; });
  playerDb.flushDirtyPlayers = () => blockedWrite;
  try {
    const response = await fetch(`${url}/boss-fights/${store.bossFights[0].id}/attack`, {
      method: 'POST',
      signal: AbortSignal.timeout(2000),
      headers: { 'x-telegram-user-id': '90520', 'content-type': 'application/json' },
      body: JSON.stringify({ weaponId: 'satchel', requestId: 'http-replay' }),
    });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.ok(result.data.hit.damage > 0);
    assert.equal(result.data.fight.combat_revision,1);
    assert.ok(Number(player.talent_damage_progress || 0) + Number(player.available_talent_points || 0) > 0, 'Poison earns talent progression');
    assert.equal(result.data.player.weapon_inventory['small-poison'], 1);
    assert.ok(store.bossDamageLogs[0].damage > 0);
    assert.equal(store.bossFights[0].current_hp, 10000 - result.data.hit.damage);

    const replay = await fetch(`${url}/boss-fights/${store.bossFights[0].id}/attack`, {
      method: 'POST', headers: { 'x-telegram-user-id': '90520', 'content-type': 'application/json' },
      body: JSON.stringify({ weaponId: 'satchel', requestId: 'http-replay' }),
    });
    assert.equal(replay.status, 200);
    assert.deepEqual(await replay.json(), result);
    assert.equal(player.weapon_inventory['small-poison'], 1);
    assert.equal(store.bossFights[0].current_hp, 10000 - result.data.hit.damage);

    player.weapon_cooldowns = {};
    player.weapon_inventory['small-poison'] = 5;
    const batchResponse = await fetch(`${url}/boss-fights/${store.bossFights[0].id}/attack`, {
      method: 'POST',
      headers: { 'x-telegram-user-id': '90520', 'content-type': 'application/json' },
      body: JSON.stringify({ weaponId: 'satchel', multiplier: 5 }),
    });
    const batch = await batchResponse.json();
    assert.equal(batchResponse.status, 200, JSON.stringify(batch));
    assert.equal(batch.data.player.weapon_inventory['small-poison'], 0);
    assert.equal(batch.data.fight.combat_revision,2);
    assert.ok(batch.data.hit.damage >= result.data.hit.damage * 5);

    player.weapon_cooldowns = {};
    player.weapon_inventory['small-poison'] = 4;
    const insufficient = await fetch(`${url}/boss-fights/${store.bossFights[0].id}/attack`, {
      method: 'POST',
      headers: { 'x-telegram-user-id': '90520', 'content-type': 'application/json' },
      body: JSON.stringify({ weaponId: 'satchel', multiplier: 5 }),
    });
    assert.equal(insufficient.status, 400);
    assert.equal((await insufficient.json()).code, 'NOT_ENOUGH_POISON');
    assert.equal(player.weapon_inventory['small-poison'], 4);

    const progressBefore = [player.talent_damage_progress, player.next_talent_threshold_index, player.available_talent_points];
    for (const weaponId of ['fist', 'knuckle']) {
      player.weapon_cooldowns = {};
      const hit = await fetch(url + '/boss-fights/' + store.bossFights[0].id + '/attack', {method:'POST',headers:{'x-telegram-user-id':'90520','content-type':'application/json'},body:JSON.stringify({weaponId})});
      assert.equal(hit.status, 200, await hit.text());
      assert.deepEqual([player.talent_damage_progress, player.next_talent_threshold_index, player.available_talent_points], progressBefore);
    }
    player.talent_levels = { t35: 5, t36: 5, t38: 1 };
    player.weapon_inventory = { ...player.weapon_inventory, 'large-poison': 1 };
    player.talent_combat_state = { [store.bossFights[0].id]: { toxicMarks: 5 } };
    store.bossFights[0].current_hp = 10000;
    const largePoisonResponse = await fetch(`${url}/boss-fights/${store.bossFights[0].id}/attack`, {
      method: 'POST',
      headers: { 'x-telegram-user-id': '90520', 'content-type': 'application/json' },
      body: JSON.stringify({ weaponId: 'c4' }),
    });
    const largePoisonResult = await largePoisonResponse.json();
    assert.equal(largePoisonResponse.status, 200, JSON.stringify(largePoisonResult));
    assert.ok(largePoisonResult.data.hit.damage >= 260, `Expected 200 base + 60 talent bonus, got ${largePoisonResult.data.hit.damage}`);
    assert.equal(largePoisonResult.data.player.talent_combat_state[store.bossFights[0].id].toxicMarks, 0);
    assert.equal(largePoisonResult.data.player.weapon_inventory['large-poison'], 0);
    const originalRandom = Math.random;
    try {
      player.talent_levels = { t05: 10 };
      player.weapon_cooldowns = {};
      store.bossFights[0].current_hp = 10000;
      const fightId = store.bossFights[0].id;
      const now = Date.now();
      const expiresAt = now + 12000;
      player.talent_combat_state = { [fightId]: { bleed: { damage: 10, lastTickAt: now, expiresAt } } };
      Math.random = () => 0;
      const critical = await fetch(`${url}/boss-fights/${store.bossFights[0].id}/attack`, {
        method:'POST', headers:{'x-telegram-user-id':'90520','content-type':'application/json'},
        body:JSON.stringify({weaponId:'fist'}), signal:AbortSignal.timeout(2000),
      });
      const confirmed = await critical.json();
      assert.equal(critical.status, 200, JSON.stringify(confirmed));
      assert.equal(confirmed.data.hit.isCrit, true, 'Server must expose the critical hit to the animation');
      assert.equal(confirmed.data.player.talent_combat_state[fightId].bleed?.expiresAt, expiresAt);
      assert.ok(confirmed.data.hit.damage > 0);

      player.talent_levels = { t34: 10 };
      player.weapon_inventory['large-poison'] = 5;
      player.talent_combat_state = {};
      store.bossFights[0].current_hp = 10000;
      let rolls = 0;
      Math.random = () => rolls++ === 0 ? 0 : 0.99;
      const saved = await fetch(`${url}/boss-fights/${fightId}/attack`, {
        method: 'POST',
        headers: { 'x-telegram-user-id': '90520', 'content-type': 'application/json' },
        body: JSON.stringify({ weaponId: 'c4', multiplier: 5 }),
      });
      const savedResult = await saved.json();
      assert.equal(saved.status, 200, JSON.stringify(savedResult));
      assert.equal(savedResult.data.player.weapon_inventory['large-poison'], 1);
      assert.equal(savedResult.data.hit.damage, GAME_CONFIG.WEAPONS.find(weapon => weapon.id === 'c4').damage * 5);
    } finally { Math.random = originalRandom; }
  } finally {
    release();
    playerDb.flushDirtyPlayers = originalFlush;
    await new Promise((resolve) => server.close(resolve));
  }
});
