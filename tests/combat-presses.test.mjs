import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCombatPresses, runCombatPresses, MAX_COMBAT_PRESSES } from '../server/utils/combatPresses.js';
import { createPoisonAttackQueue } from '../src/lib/poisonAttackQueue.js';

process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) process.env[key] = '';

const [{ createApp }, { store }, { playerDb }] = await Promise.all([
  import('../server/app.js'),
  import('../server/data/store.js'),
  import('../server/data/player-db.js'),
]);

const capture = () => ({ statusCode: 0, body: '', writeHead(code) { this.statusCode = code; }, end(body) { this.body = body; } });
const ok = (response, data) => { response.writeHead(200, {}); response.end(JSON.stringify({ data })); };
const fail = (response, code) => { response.writeHead(400, {}); response.end(JSON.stringify({ code, message: code })); };

test('press lists are validated and capped', () => {
  assert.equal(parseCombatPresses({ weaponId: 'satchel' }), null);
  assert.deepEqual(parseCombatPresses({ presses: [{ weaponId: 'satchel', multiplier: 5 }] }), { presses: [{ weaponId: 'satchel', multiplier: 5 }] });
  assert.equal(parseCombatPresses({ presses: [] }).error, 'INVALID_COMBAT_PRESSES');
  assert.equal(parseCombatPresses({ presses: [{ weaponId: 'satchel', multiplier: 7 }] }).error, 'INVALID_COMBAT_PRESSES');
  assert.equal(parseCombatPresses({ presses: Array.from({ length: MAX_COMBAT_PRESSES + 1 }, () => ({ weaponId: 'satchel' })) }).error, 'INVALID_COMBAT_PRESSES');
});

test('a batch resolves each press in order and stops at the finishing hit', () => {
  let hp = 30;
  const seen = [];
  const response = capture();
  runCombatPresses(response, [1, 2, 3, 4].map(() => ({ weaponId: 'satchel', multiplier: 1 })), (sub, body) => {
    seen.push(body.weaponId);
    hp = Math.max(0, hp - 10);
    ok(sub, { fight: { id: 'f', current_hp: hp, status: hp ? 'active' : 'dead' }, hit: { damage: 10, isCrit: hp === 10 }, xpGranted: 4, rewardSummary: hp ? null : { rank: 1 } });
  });
  const { data } = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(seen.length, 3);
  assert.equal(data.processed, 3);
  assert.equal(data.fight.status, 'dead');
  assert.equal(data.hit.damage, 30);
  assert.equal(data.hit.isCrit, true);
  assert.equal(data.xpGranted, 12);
  assert.deepEqual(data.rewardSummary, { rank: 1 });
  assert.equal(data.rejected.code, 'BOSS_FIGHT_FINISHED');
});

test('a rejected first press answers like a single rejected attack', () => {
  const response = capture();
  runCombatPresses(response, [{ weaponId: 'satchel', multiplier: 1 }], sub => fail(sub, 'NOT_ENOUGH_POISON'));
  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).code, 'NOT_ENOUGH_POISON');
});

test('a later rejection keeps accepted presses and reports the rest', () => {
  const response = capture();
  let calls = 0;
  runCombatPresses(response, [1, 2, 3].map(() => ({ weaponId: 'satchel', multiplier: 1 })), sub => {
    calls += 1;
    if (calls === 2) return fail(sub, 'NOT_ENOUGH_POISON');
    ok(sub, { fight: { id: 'f', current_hp: 90, status: 'active' }, hit: { damage: 10 } });
  });
  const { data } = JSON.parse(response.body);
  assert.equal(calls, 2);
  assert.equal(data.processed, 1);
  assert.deepEqual({ index: data.rejected.index, code: data.rejected.code }, { index: 1, code: 'NOT_ENOUGH_POISON' });
});

test('taps queued during a request leave together in the next request', async () => {
  const sent = [];
  let release;
  const queue = createPoisonAttackQueue({
    pressBatch: () => true,
    onChange() {},
    send: request => { sent.push(request.presses.length); return new Promise(resolve => { release = () => resolve({ fight: { status: 'active' } }); }); },
  });
  const weapon = { id: 'satchel' };
  queue.enqueue({ weapon, multiplier: 1, fightId: 'f' }, 100);
  await new Promise(resolve => setImmediate(resolve));
  for (let index = 0; index < 12; index += 1) queue.enqueue({ weapon, multiplier: 1, fightId: 'f' }, 100);
  release();
  await new Promise(resolve => setImmediate(resolve));
  release();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(sent, [1, 12]);
  assert.equal(queue.size, 0);
});

test('server applies a press list atomically with one response', async () => {
  await store.init();
  await playerDb.init(store);
  const [attacker] = playerDb.attachPlayers([{
    id: 'press-batch-player', telegram_id: '9301', created_by: 'telegram_9301@miniapp.local', username: 'Batch',
    level: 1, xp: 0, weapon_inventory: { 'small-poison': 3, 'medium-poison': 2 }, weapon_cooldowns: {}, talent_levels: {},
    boss_hits_today: 0, boss_damage_today: 0, boss_kills: 0, boss_kills_by_id: {}, keycards: {}, pending_boss_boxes: [],
  }]);
  store.players = [attacker];
  const fight = { id: 'press-batch-fight', boss_id: 'heli', max_hp: 10000000, current_hp: 10000000, status: 'active', opened_by_email: attacker.created_by };
  store.bossFights = [fight];
  store.bossDamageLogs = [];
  const server = createApp();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/boss-fights/${fight.id}/attack`;
    const post = body => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-telegram-user-id': '9301' }, body: JSON.stringify(body) });
    const presses = [{ weaponId: 'satchel' }, { weaponId: 'f4' }, { weaponId: 'satchel' }, { weaponId: 'satchel' }, { weaponId: 'satchel' }];
    const response = await post({ presses, requestId: 'combat:1:batch' });
    assert.equal(response.status, 200);
    const { data } = await response.json();
    assert.equal(data.processed, 4);
    assert.equal(data.rejected.code, 'NOT_ENOUGH_POISON');
    assert.equal(attacker.weapon_inventory['small-poison'], 0);
    assert.equal(attacker.weapon_inventory['medium-poison'], 1);
    assert.equal(data.playerDamageLog.hits, 4);
    assert.equal(fight.current_hp, 10000000 - data.hit.damage);
    const replay = await post({ presses, requestId: 'combat:1:batch' });
    assert.equal(replay.status, 200);
    assert.equal(attacker.weapon_inventory['medium-poison'], 1);
    assert.equal(store.bossDamageLogs.find(log => log.fight_id === fight.id).hits, 4);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('ship batches resolve presses in order under one replay-safe receipt', async () => {
  const { ensureShip, openShipFight, attackShipFight } = await import('../server/utils/clanShip.js');
  const clan = { id: 'c', name: 'C' }, ship = ensureShip(clan);
  ship.progress.hull = 100000000;
  const player = { id: 'p', created_by: 'p@test', nickname: 'P', level: 80, talent_tree_version: 2, talent_levels: {}, inventory_items: [], equipped_items: {}, weapon_inventory: { 'large-poison': 1000, 'small-poison': 2 }, weapon_cooldowns: {} };
  const now = Date.parse('2026-10-29T12:00:00Z');
  const opened = openShipFight(clan, player, { moduleId: 'hull', requestId: 'ship-batch-open-request' }, now);
  const hpBefore = ship.fights.hull.current_hp;
  const body = { moduleId: 'hull', fightId: opened.fightId, requestId: 'ship-batch-hit-request',
    presses: [{ weaponId: 'c4', multiplier: 100 }, { weaponId: 'satchel', multiplier: 1 }, { weaponId: 'satchel', multiplier: 1 }, { weaponId: 'satchel', multiplier: 1 }, { weaponId: 'c4', multiplier: 10 }] };
  const result = attackShipFight(clan, player, [player], body, { now, rng: () => 0.9 });
  assert.equal(result.processed, 3);
  assert.equal(result.rejected.code, 'NO_POISON_INVENTORY');
  assert.equal(result.rejected.index, 3);
  assert.equal(player.weapon_inventory['large-poison'], 900);
  assert.equal(player.weapon_inventory['small-poison'], 0);
  assert.equal(ship.fights.hull.current_hp, hpBefore - result.damage);
  const replay = attackShipFight(clan, player, [player], body, { now, rng: () => 0.9 });
  assert.equal(replay.replayed, true);
  assert.equal(player.weapon_inventory['large-poison'], 900);
  assert.equal(ship.fights.hull.current_hp, hpBefore - result.damage);
});
