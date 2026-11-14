import { getPostgresSql } from './postgres.js';
import { buildBootstrapPayload } from '../utils/bootstrap.js';

const DATABASE_URL_KEYS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
];

const runtime = {
  initialized: false,
  sql: null,
  store: null,
  players: [],
  playerById: new Map(),
  playerBySessionKey: new Map(),
  dirtyPlayerIds: new Set(),
  dirtyRevision: new Map(),
  flushQueue: Promise.resolve(),
  rawToProxy: new WeakMap(),
};

function getDatabaseUrl() {
  for (const key of DATABASE_URL_KEYS) {
    const value = String(process.env[key] || '').trim();
    if (value) return value;
  }
  return '';
}

function getSql() {
  if (!runtime.sql) {
    runtime.sql = getPostgresSql();
  }
  return runtime.sql;
}

function cloneJson(value, fallback = {}) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  if (typeof value === 'object') {
    return JSON.parse(JSON.stringify(value));
  }
  return fallback;
}

function buildPlayerData(player = {}) {
  const data = cloneJson(player, {});
  delete data.id;
  delete data.username;
  delete data.level;
  delete data.xp;
  delete data.coins;
  delete data.scrap;
  delete data.safe_scrap;
  delete data.scrap_per_hour;
  delete data.created_at;
  delete data.created_date;
  return data;
}

function buildPlayerProgress(player = {}) {
  const payload = buildBootstrapPayload(player, null);
  return payload?.bootstrap || {};
}

function getPlayerSessionKey(playerOrSession = {}) {
  const telegramId = String(playerOrSession.telegram_id || playerOrSession.telegramId || '').trim();
  const createdBy = String(playerOrSession.created_by || playerOrSession.createdBy || playerOrSession.email || '').trim().toLowerCase();
  if (telegramId) return `telegram:${telegramId}`;
  if (createdBy) return `created_by:${createdBy}`;
  return '';
}

function getPlayerAuthorityScore(player = {}) {
  const level = Math.max(0, Number(player.level || 0));
  const xp = Math.max(0, Number(player.xp || 0));
  const totalBossDamage = Math.max(0, Number(player.total_boss_damage || player.boss_damage_lifetime || 0));
  const tentacles = Math.max(0, Number(player.tentacles ?? player.scrap ?? player.coins ?? 0));
  const premium = Math.max(0, Number(player.premium || 0));
  const bossKills = Math.max(0, Number(player.boss_kills || 0));
  const talentPoints = Math.max(0, Number(player.talent_points || 0));
  const inventoryItems = Array.isArray(player.inventory_items) ? player.inventory_items.length : 0;
  const pendingBoxes = Array.isArray(player.pending_boss_boxes) ? player.pending_boss_boxes.length : 0;
  const rouletteSpins = Math.max(0, Number(player.roulette_bonus_spins || 0));
  const openedBoxes = Math.max(0, Number(player.opened_boxes_total || 0));
  const energy = Math.max(0, Number(player.energy || 0));

  return (
    level * 1e12 +
    xp * 1e9 +
    totalBossDamage * 1e6 +
    tentacles * 1e3 +
    premium * 100 +
    bossKills * 10 +
    talentPoints +
    inventoryItems +
    pendingBoxes +
    rouletteSpins +
    openedBoxes +
    Math.min(energy, 999) / 1000
  );
}

function getPlayerRecencyScore(player = {}) {
  const timestamps = [
    player.updated_at,
    player.last_energy_update,
    player.last_login_date,
    player.created_at,
    player.created_date,
  ]
    .map((value) => Date.parse(value || ''))
    .filter((value) => Number.isFinite(value) && value > 0);

  return timestamps.length ? Math.max(...timestamps) : 0;
}

function pickBetterPlayer(currentPlayer, nextPlayer) {
  if (!currentPlayer) return nextPlayer;
  if (!nextPlayer) return currentPlayer;

  const currentScore = getPlayerAuthorityScore(currentPlayer);
  const nextScore = getPlayerAuthorityScore(nextPlayer);
  if (nextScore > currentScore) return nextPlayer;
  if (nextScore < currentScore) return currentPlayer;

  const currentRecency = getPlayerRecencyScore(currentPlayer);
  const nextRecency = getPlayerRecencyScore(nextPlayer);
  if (nextRecency > currentRecency) return nextPlayer;
  if (nextRecency < currentRecency) return currentPlayer;

  return String(nextPlayer.id || '') > String(currentPlayer.id || '') ? nextPlayer : currentPlayer;
}

function toIsoTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function toDbPlayerRecord(player = {}) {
  const createdAt = toIsoTimestamp(player.created_at || player.created_date);
  const coins = Number(player.tentacles ?? player.scrap ?? player.coins ?? 0) || 0;
  return {
    id: String(player.id || '').trim(),
    username: String(player.username || player.nickname || 'player').trim().slice(0, 120),
    level: Number(player.level || 1) || 1,
    xp: Number(player.xp || 0) || 0,
    coins,
    data: buildPlayerData(player),
    created_at: createdAt,
  };
}

function fromDbPlayerRecord(row = {}) {
  const data = cloneJson(row.data, {});
  const createdAt = toIsoTimestamp(row.created_at);
  const player = {
    ...data,
    id: String(row.id || data.id || '').trim(),
    username: String(row.username || data.username || 'player').trim(),
    level: Number(row.level || data.level || 1) || 1,
    xp: Number(row.xp || data.xp || 0) || 0,
    coins: Number(row.coins ?? data.coins ?? data.tentacles ?? data.scrap ?? 0) || 0,
    created_at: createdAt,
    created_date: data.created_date || createdAt,
  };
  player.tentacles = Number(data.tentacles ?? data.scrap ?? row.coins ?? data.coins ?? 0) || 0;
  if (data.safe_tentacles === undefined && data.safe_scrap !== undefined) player.safe_tentacles = Number(data.safe_scrap) || 0;
  if (data.tentacles_per_hour === undefined && data.scrap_per_hour !== undefined) player.tentacles_per_hour = Number(data.scrap_per_hour) || 0;
  delete player.scrap;
  delete player.safe_scrap;
  delete player.scrap_per_hour;
  delete player.coins;
  return player;
}

function mergeBootstrapProgress(player = {}, progress = {}) {
  if (!progress || typeof progress !== 'object') return player;
  return {
    ...player,
    ...(progress.player || {}),
    ...(progress.inventory || {}),
    ...(progress.fishing_state || {}),
    ...(progress.progression || {}),
    ...(progress.daily_tasks_state || {}),
    ...(progress.leaderboard_meta || {}),
    ...(progress.meta || {}),
  };
}

function mergePlayerLists(primaryPlayers = [], secondaryPlayers = []) {
  const byId = new Map();
  for (const player of primaryPlayers) {
    const id = String(player?.id || '').trim();
    if (!id) continue;
    if (!byId.has(id)) byId.set(id, player);
  }
  for (const player of secondaryPlayers) {
    const id = String(player?.id || '').trim();
    if (!id) continue;
    if (!byId.has(id)) byId.set(id, player);
  }
  return Array.from(byId.values());
}

function dedupePlayersBySessionKey(players = []) {
  const byKey = new Map();
  for (const player of players) {
    const id = String(player?.id || '').trim();
    if (!id) continue;
    const sessionKey = getPlayerSessionKey(player) || `player:${id}`;
    const existing = byKey.get(sessionKey) || null;
    byKey.set(sessionKey, pickBetterPlayer(existing, player));
  }
  return Array.from(byKey.values());
}

function wrapPlayer(player) {
  if (!player || typeof player !== 'object') return player;
  const cached = runtime.rawToProxy.get(player);
  if (cached) return cached;

  const proxy = new Proxy(player, {
    set(target, property, value) {
      if (Object.is(target[property], value)) return true;
      target[property] = value;
      if (property !== '__isPlayerProxy' && property !== '__rawPlayer') {
        const playerId = String(target.id || '').trim();
        if (playerId) {
          runtime.dirtyPlayerIds.add(playerId);
          runtime.dirtyRevision.set(playerId, (runtime.dirtyRevision.get(playerId) || 0) + 1);
        }
      }
      return true;
    },
  });

  runtime.rawToProxy.set(player, proxy);
  return proxy;
}

function attachPlayers(players = []) {
  runtime.players = players.map((player) => wrapPlayer(player));
  runtime.playerById = new Map(runtime.players.map((player) => [String(player.id || ''), player]));
  runtime.playerBySessionKey = new Map(
    runtime.players.map((player) => {
      const sessionKey = getPlayerSessionKey(player);
      return sessionKey ? [sessionKey, player] : [String(player.id || ''), player];
    }).filter(([key]) => Boolean(String(key || '').trim()))
  );
  runtime.dirtyPlayerIds.clear();
  runtime.dirtyRevision.clear();
  return runtime.players;
}

async function ensureSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT,
      level INT DEFAULT 1,
      xp INT DEFAULT 0,
      coins INT DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS player_progress (
      player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      progress JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;
}

async function loadPlayers() {
  const sql = getSql();
  const rows = await sql`
    SELECT p.id, p.username, p.level, p.xp, p.coins, p.data, p.created_at, pr.progress
    FROM players p
    LEFT JOIN player_progress pr ON pr.player_id = p.id
    ORDER BY p.created_at ASC, p.id ASC
  `;
  // The canonical row wins over the redundant bootstrap projection, which
  // could be left behind if the process stopped between the two writes.
  const dbPlayers = rows.map((row) => ({
    ...mergeBootstrapProgress({}, cloneJson(row.progress, {})),
    ...fromDbPlayerRecord(row),
  }));
  const storePlayers = Array.isArray(runtime.store?.players) ? runtime.store.players : [];
  const merged = dedupePlayersBySessionKey(mergePlayerLists(dbPlayers, storePlayers));
  console.log('[sql] player load', {
    dbPlayers: dbPlayers.length,
    runtimePlayers: storePlayers.length,
    mergedPlayers: merged.length,
  });
  return merged;
}

async function upsertPlayer(player) {
  const sql = getSql();
  const record = toDbPlayerRecord(player);
  if (!record.id) return null;
  const progress = JSON.stringify(buildPlayerProgress(player));
  await savePlayerSnapshot(sql, record, progress);
  console.log('[sql] player save', {
    playerId: record.id,
    username: record.username,
    level: record.level,
    xp: record.xp,
    coins: record.coins,
    energy: record.data.energy,
    talentPoints: record.data.available_talent_points ?? record.data.talent_points,
  });
  return record;
}

export async function savePlayerSnapshot(sql, record, progress) {
  // One atomic statement saves both projections with one database round trip.
  await sql`
    WITH saved_player AS (
    INSERT INTO players (id, username, level, xp, coins, data, created_at)
    VALUES (${record.id}, ${record.username}, ${record.level}, ${record.xp}, ${record.coins}, ${JSON.stringify(record.data)}::jsonb, ${record.created_at}::timestamp)
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      level = EXCLUDED.level,
      xp = EXCLUDED.xp,
      coins = EXCLUDED.coins,
      data = EXCLUDED.data
    RETURNING id
    )
    INSERT INTO player_progress (player_id, progress, updated_at)
    SELECT id, ${progress}::jsonb, now() FROM saved_player
    ON CONFLICT (player_id) DO UPDATE SET
      progress = EXCLUDED.progress,
      updated_at = EXCLUDED.updated_at
  `;
}

async function flushDirtyPlayersNow(playerIds = null) {
  if (!getDatabaseUrl()) {
    if (!runtime.dirtyPlayerIds.size) return 0;
    if (runtime.store) await runtime.store.persistNow();
    runtime.dirtyPlayerIds.clear();
    return 0;
  }
  if (!runtime.dirtyPlayerIds.size) return 0;
  const ids = Array.from(runtime.dirtyPlayerIds).filter(id => !playerIds || playerIds.includes(id));
  let count = 0;
  for (const id of ids) {
    const player = runtime.playerById.get(id);
    if (!player) {
      runtime.dirtyPlayerIds.delete(id);
      continue;
    }
    const revision = runtime.dirtyRevision.get(id) || 0;
    await upsertPlayer(player);
    if ((runtime.dirtyRevision.get(id) || 0) === revision) runtime.dirtyPlayerIds.delete(id);
    count += 1;
  }
  if (count > 0) {
    console.log('[sql] player flush', {
      flushed: count,
      dirtyLeft: runtime.dirtyPlayerIds.size,
    });
  }
  return count;
}

function flushDirtyPlayers(playerIds = null) {
  runtime.flushQueue = runtime.flushQueue.catch(() => {}).then(() => flushDirtyPlayersNow(playerIds));
  return runtime.flushQueue;
}

function addPlayer(player) {
  const wrapped = wrapPlayer(player);
  const sessionKey = getPlayerSessionKey(wrapped);
  if (sessionKey && runtime.playerBySessionKey.has(sessionKey)) {
    const existing = runtime.playerBySessionKey.get(sessionKey);
    console.log('[sql] player reused', {
      playerId: existing?.id || null,
      sessionKey,
    });
    return existing;
  }
  const existingById = runtime.playerById.get(String(wrapped.id || '').trim());
  if (existingById) {
    console.log('[sql] player reused', {
      playerId: existingById.id || null,
      sessionKey: sessionKey || null,
    });
    return existingById;
  }
  runtime.players.push(wrapped);
  runtime.playerById.set(String(wrapped.id || ''), wrapped);
  if (sessionKey) {
    runtime.playerBySessionKey.set(sessionKey, wrapped);
  }
  runtime.dirtyPlayerIds.add(String(wrapped.id || ''));
  runtime.dirtyRevision.set(String(wrapped.id || ''), 1);
  console.log('[sql] player created', {
    playerId: wrapped.id || null,
    username: wrapped.username || null,
    level: wrapped.level || 1,
    xp: wrapped.xp || 0,
  });
  return wrapped;
}

function getPlayerById(playerId) {
  return runtime.playerById.get(String(playerId || '').trim()) || null;
}

function getPlayerBySession(session = {}) {
  const sessionKey = getPlayerSessionKey(session);
  if (!sessionKey) return null;
  return runtime.playerBySessionKey.get(sessionKey) || null;
}

async function init(store) {
  if (runtime.initialized) return runtime.players;
  runtime.initialized = true;
  runtime.store = store;
  if (!getDatabaseUrl()) {
    if (process.env.NODE_ENV === 'production' && process.env.SECURITY_AUDIT_SYNTHETIC !== 'true') throw new Error('DATABASE_URL is required in production');
    const players = attachPlayers(Array.isArray(store?.players) ? store.players : []);
    if (store) store.players = players;
    return players;
  }
  await ensureSchema();
  const players = await loadPlayers();
  const attached = attachPlayers(players);
  if (store) {
    store.players = attached;
  }
  console.log('[sql] player init complete', {
    players: attached.length,
  });
  return attached;
}

export const playerDb = {
  init,
  getDatabaseUrl,
  getSql,
  loadPlayers,
  upsertPlayer,
  flushDirtyPlayers,
  addPlayer,
  getPlayerById,
  getPlayerBySession,
  getPlayerSessionKey,
  dedupePlayersBySessionKey,
  wrapPlayer,
  buildPlayerData,
  buildPlayerProgress,
  toDbPlayerRecord,
  fromDbPlayerRecord,
  mergePlayerLists,
  attachPlayers,
};
