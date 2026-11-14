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
  try {
    const response = await fetch(`${url}/boss-fights/${store.bossFights[0].id}/attack`, {
      method: 'POST',
      headers: { 'x-telegram-user-id': '90520', 'content-type': 'application/json' },
      body: JSON.stringify({ weaponId: 'satchel' }),
    });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.ok(result.data.hit.damage > 0);
    assert.equal(result.data.player.weapon_inventory['small-poison'], 1);
    assert.ok(store.bossDamageLogs[0].damage > 0);
    assert.equal(store.bossFights[0].current_hp, 10000 - result.data.hit.damage);

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
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
