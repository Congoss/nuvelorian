import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { store } from '../server/data/store.js';
import { playerDb } from '../server/data/player-db.js';

function parseArgs(argv) {
  const args = { apply: false, exportPath: '', source: 'store', input: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--export') args.exportPath = String(argv[++i] || '').trim();
    else if (arg === '--source') args.source = String(argv[++i] || 'store').trim();
    else if (arg === '--input') args.input = String(argv[++i] || '').trim();
  }
  return args;
}

function isDemoPlayerRecord(player) {
  const username = String(player?.username || '').trim().toLowerCase();
  const createdBy = String(player?.created_by || '').trim().toLowerCase();
  const telegramId = String(player?.telegram_id || '').trim();
  const playerId = String(player?.id || '').trim().toLowerCase();

  return (
    playerId.startsWith('player-demo-') ||
    playerId.startsWith('sim-') ||
    username.startsWith('demo_player_') ||
    username.startsWith('invite_demo_') ||
    username === 'local_tester' ||
    createdBy.startsWith('demo_') ||
    createdBy.includes('local_tester@') ||
    telegramId.startsWith('9000')
  );
}

function isSimulatedPlayer(player) {
  return Boolean(player?.isBot || player?.isSimulated || String(player?.id || '').startsWith('sim-'));
}

function filterRealPlayers(players = []) {
  return players.filter((player) => !isDemoPlayerRecord(player) && !isSimulatedPlayer(player));
}

async function loadSourcePlayers(args) {
  if (args.source === 'file') {
    if (!args.input) throw new Error('--input is required when --source file is used');
    const raw = await readFile(resolve(args.input), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed?.players) ? parsed.players : [];
  }

  await store.init();
  return Array.isArray(store.players) ? store.players : [];
}

function samplePlayers(players, limit = 5) {
  return players.slice(0, limit).map((player) => ({
    id: player.id,
    username: player.username,
    level: player.level,
    xp: player.xp,
    coins: Number(player.coins ?? player.scrap ?? 0) || 0,
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourcePlayers = await loadSourcePlayers(args);
  const realPlayers = filterRealPlayers(sourcePlayers);
  const demoPlayers = sourcePlayers.length - realPlayers.length;

  console.log(JSON.stringify({
    source: args.source,
    totalPlayers: sourcePlayers.length,
    realPlayers: realPlayers.length,
    demoPlayers,
    sample: samplePlayers(realPlayers, 5),
  }, null, 2));

  if (args.exportPath) {
    const payload = {
      players: realPlayers,
      count: realPlayers.length,
      exportedAt: new Date().toISOString(),
    };
    await writeFile(resolve(args.exportPath), JSON.stringify(payload, null, 2), 'utf8');
  }

  if (!args.apply) {
    return;
  }

  await playerDb.init(null);
  if (!realPlayers.length) {
    throw new Error('No real players found. Migration aborted.');
  }

  for (const player of realPlayers) {
    await playerDb.upsertPlayer(player);
  }

  const db = playerDb.getSql();
  const countRow = await db`SELECT COUNT(*)::int AS count FROM players`;
  const sampleRows = await db`
    SELECT id, username, level, xp, coins
    FROM players
    ORDER BY created_at ASC, id ASC
    LIMIT 5
  `;

  console.log(JSON.stringify({
    migrated: realPlayers.length,
    databaseCount: Number(countRow?.[0]?.count || 0),
    sample: sampleRows,
  }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
