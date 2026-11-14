import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// A confirmed attack reply must already be durable. Run the real server
// process on local storage, kill it hard right after a reply and in the middle
// of a request, restart it and compare HP, damage logs and poison stock.
const TELEGRAM_ID = '9401';
const PLAYER_EMAIL = `telegram_${TELEGRAM_ID}@miniapp.local`;
const FIGHT_ID = 'crash-fight';
const MAX_HP = 1_000_000_000;
const STOCK = 5000;

function seedState(path) {
  const now = Date.now();
  writeFileSync(path, JSON.stringify({
    players: [{
      id: 'crash-player', telegram_id: TELEGRAM_ID, created_by: PLAYER_EMAIL, username: 'crash', level: 30, xp: 0,
      weapon_inventory: { 'large-poison': STOCK }, weapon_cooldowns: {}, talent_levels: {}, boss_hits_today: 0,
      boss_damage_today: 0, boss_kills: 0, boss_kills_by_id: {}, keycards: {}, pending_boss_boxes: [], tutorial_disabled: true,
    }],
    bossFights: [{ id: FIGHT_ID, boss_id: 'heli', max_hp: MAX_HP, current_hp: MAX_HP, status: 'active', opened_by_email: PLAYER_EMAIL,
      solo: true, started_at: new Date(now).toISOString(), ends_at: new Date(now + 6 * 3600000).toISOString() }],
    bossDamageLogs: [], clans: [],
  }));
}

function startServer(statePath, port) {
  const env = { ...process.env, NODE_ENV: 'development', HOST: '127.0.0.1', PORT: String(port), VITE_TELEGRAM_USE_MOCK: 'true',
    LOCAL_GAME_STATE_PATH: statePath, DATABASE_URL: '', POSTGRES_URL: '', POSTGRES_PRISMA_URL: '', POSTGRES_URL_NON_POOLING: '',
    TELEGRAM_BOT_TOKEN: '', COMBAT_BACKGROUND_WRITES: '' };
  const child = spawn(process.execPath, ['server/index.js'], { env, stdio: 'ignore' });
  return child;
}

async function waitReady(port) {
  for (let i = 0; i < 100; i += 1) {
    try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) return; } catch { /* booting */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('server did not start');
}

const headers = { 'content-type': 'application/json', 'x-telegram-mock-user': 'true', 'x-telegram-user-id': TELEGRAM_ID };
const presses = Array.from({ length: 10 }, () => ({ weaponId: 'c4', multiplier: 100 }));

async function readState(port) {
  const fight = (await (await fetch(`http://127.0.0.1:${port}/boss-fights/${FIGHT_ID}`, { headers })).json()).data;
  const player = (await (await fetch(`http://127.0.0.1:${port}/players/me`, { headers })).json()).data;
  return { hp: Number(fight.current_hp), stock: Number(player.weapon_inventory?.['large-poison']) };
}

function kill(child) {
  return new Promise(resolve => { child.once('exit', resolve); child.kill('SIGKILL'); });
}

test('a 10×100 batch is committed before it is confirmed and survives a hard kill', { timeout: 60000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'p4-crash-'));
  const statePath = join(dir, 'state.json');
  seedState(statePath);
  const port = 35000 + Math.floor(Math.random() * 20000);
  let server = startServer(statePath, port);
  try {
    await waitReady(port);
    const reply = await fetch(`http://127.0.0.1:${port}/boss-fights/${FIGHT_ID}/attack`, {
      method: 'POST', headers, body: JSON.stringify({ presses, requestId: `combat:${Date.now()}:crash-a` }),
    });
    assert.equal(reply.status, 200);
    const { data } = await reply.json();
    assert.equal(data.processed, 10);
    assert.equal(data.playerDamageLog.hits, 1000);
    const confirmed = { hp: Number(data.fight.current_hp), stock: Number(data.player.weapon_inventory['large-poison']) };
    assert.equal(confirmed.stock, STOCK - 1000);
    assert.equal(confirmed.hp, MAX_HP - data.hit.damage);

    // Kill immediately after the confirmation: nothing confirmed may be lost.
    await kill(server);
    server = startServer(statePath, port);
    await waitReady(port);
    assert.deepEqual(await readState(port), confirmed);

    // Kill while the next batch is in flight: the restart shows either the
    // whole batch or none of it, and HP always matches the poison spent.
    const inFlight = fetch(`http://127.0.0.1:${port}/boss-fights/${FIGHT_ID}/attack`, {
      method: 'POST', headers, body: JSON.stringify({ presses, requestId: `combat:${Date.now()}:crash-b` }),
    }).catch(() => null);
    await new Promise(resolve => setTimeout(resolve, 5));
    await kill(server);
    const late = await inFlight;
    server = startServer(statePath, port);
    await waitReady(port);
    const after = await readState(port);
    const spent = confirmed.stock - after.stock;
    assert.ok(spent === 0 || spent === 1000, `partial batch persisted: ${spent} poisons`);
    if (spent === 0) assert.equal(after.hp, confirmed.hp);
    else assert.ok(after.hp < confirmed.hp);
    if (late?.ok) assert.equal(spent, 1000, 'a confirmed batch must be durable');
  } finally {
    if (server.exitCode === null) await kill(server);
    rmSync(dir, { recursive: true, force: true });
  }
});
