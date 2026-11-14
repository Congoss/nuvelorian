import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuestMission } from '../src/lib/questMissionCatalog.js';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';

process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) process.env[key] = '';
const [{ createApp }, { store }, { playerDb }] = await Promise.all([
  import('../server/app.js'), import('../server/data/store.js'), import('../server/data/player-db.js'),
]);

test('final quest validates unlock and grants key/poison with the mission result', async () => {
  await store.init();
  await playerDb.init(store);
  const [player] = playerDb.attachPlayers([{ id: 'quest-action-player', telegram_id: '90102', created_by: 'telegram_90102@miniapp.local', level: 10, energy: 200, task_completions: {}, keycards: {}, weapon_inventory: {} }]);
  store.players = [player];
  const server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const request = () => fetch(`${url}/players/${player.id}/tasks/complete`, {
    method: 'POST', headers: { 'x-telegram-user-id': '90102', 'content-type': 'application/json' },
    body: JSON.stringify({ taskId: 'p4-u00-final', task: { id: 'p4-u00-final', locationId: 'p4-u00' } }),
  });
  const originalRandom = Math.random;
  try {
    assert.equal((await request()).status, 404);
    for (const slug of ['scout', 'loot', 'repair', 'trade', 'fight', 'cache']) {
      const mission = getQuestMission(`p4-u00-${slug}`);
      player.task_completions[mission.id] = mission.target;
    }
    Math.random = () => 0;
    const response = await request();
    assert.equal(response.status, 200);
    const result = (await response.json()).data;
    assert.equal(result.keyDrop.keycardLocation, GAME_CONFIG.BOSSES[1].keycardLocation);
    assert.equal(result.poisonDrop.id, 'small-poison');
    assert.equal(player.keycards[result.keyDrop.keycardLocation], 1);
    assert.equal(player.weapon_inventory['small-poison'], 1);
    assert.equal(result.player.energy, 200 - getQuestMission('p4-u00-final').energy);
  } finally {
    Math.random = originalRandom;
    await new Promise((resolve) => server.close(resolve));
  }
});
