import { rebasePendingCombatRecords } from './combat-write.js';
import {gameDebugLog} from '../utils/gameDebugLog.js';
import {isDeepStrictEqual} from 'node:util';
import { withKeyLock } from '../utils/keyLock.js';
import { getPostgresSql } from './postgres.js';
import { buildBootstrapPayload } from '../utils/bootstrap.js';
import { createWriteQueue } from '../utils/writeQueue.js';

const DATABASE_URL_KEYS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
];

const runtime = {
  initialized: false,
  initPromise: null,
  sql: null,
  store: null,
  players: [],
  playerById: new Map(),
  playerBySessionKey: new Map(),
  dirtyPlayerIds: new Set(),
  dirtyRevision: new Map(),
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

export function serializePlayerData(player={}){
 if(typeof player.toJSON==='function')return JSON.stringify(buildPlayerData(player));
 const data={...player};
 for(const key of ['id','username','level','xp','coins','scrap','safe_scrap','scrap_per_hour','created_at','created_date'])delete data[key];
 return JSON.stringify(data);
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

function toDbPlayerRecord(player = {}, {serializeData=false}={}) {
  const createdAt = toIsoTimestamp(player.created_at || player.created_date);
  const coins = Number(player.tentacles ?? player.scrap ?? player.coins ?? 0) || 0;
  return {
    id: String(player.id || '').trim(),
    username: String(player.username || player.nickname || 'player').trim().slice(0, 120),
    level: Number(player.level || 1) || 1,
    xp: Number(player.xp || 0) || 0,
    coins,
    data: serializeData?serializePlayerData(player):buildPlayerData(player),
    created_at: createdAt,
  };
}

function fromDbPlayerRecord(row = {}, { takeOwnership = false } = {}) {
  const data = takeOwnership && row.data && typeof row.data === 'object' ? row.data : cloneJson(row.data, {});
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
  // These query results are private to startup. PostgreSQL already decoded
  // JSONB, so adopt the nested values instead of serializing them twice.
  const dbPlayers = rows.map((row) => ({
    ...mergeBootstrapProgress({}, typeof row.progress === 'string' ? cloneJson(row.progress, {}) : row.progress),
    ...fromDbPlayerRecord(row, { takeOwnership: true }),
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

const additiveProfileFields = new Set(['energy', 'premium', 'tentacles', 'roulette_bonus_spins']);

export function publishCommittedProfile(player, before, after, fields) {
  const apply = target => {
    for (const field of fields) {
      const previous = before[field];
      const next = after[field];
      if (next === undefined || isDeepStrictEqual(previous, next)) continue;
      if (field === 'weapon_inventory' || field === 'enhancement_gums') {
        const inventory = { ...target[field] };
        for (const key of new Set([...Object.keys(previous || {}), ...Object.keys(next || {})])) {
          const delta = Number(next?.[key] || 0) - Number(previous?.[key] || 0);
          if (delta || (Object.hasOwn(next || {}, key) && !Object.hasOwn(inventory, key))) {
            inventory[key] = Number(inventory[key] || 0) + delta;
          }
        }
        target[field] = inventory;
      } else if (additiveProfileFields.has(field) && typeof next === 'number') {
        target[field] = Number(target[field] || 0) + next - Number(previous || 0);
      } else if (next && typeof next === 'object' && !Array.isArray(next) && previous && typeof previous === 'object' && !Array.isArray(previous)) {
        const merged = { ...target[field] };
        for (const key of Object.keys(next)) {
          if (!isDeepStrictEqual(previous[key], next[key])) merged[key] = structuredClone(next[key]);
        }
        target[field] = merged;
      } else {
        target[field] = structuredClone(next);
      }
    }
  };
  apply(player);
  rebasePendingCombatRecords(player.id, record => {
    const snapshot = fromDbPlayerRecord(record);
    apply(snapshot);
    Object.assign(record, toDbPlayerRecord(snapshot), { progress: buildPlayerProgress(snapshot) });
  });
}

async function upsertPlayer(player,options) {
  return withKeyLock(`persist-player:${player.id}`, () => upsertPlayerUnlocked(player,options));
}

async function upsertPlayerUnlocked(player,options) {
  const sql = getSql();
  const record = toDbPlayerRecord(player,options);
  if (!record.id) return null;
  const progress = JSON.stringify(buildPlayerProgress(player));
  const energy=player.energy,talentPoints=player.available_talent_points ?? player.talent_points;
  await savePlayerSnapshot(sql, record, progress);
  gameDebugLog('[sql] player save', {
    playerId: record.id,
    username: record.username,
    level: record.level,
    xp: record.xp,
    coins: record.coins,
    energy,
    talentPoints,
  });
  return record;
}

export async function savePlayerSnapshot(sql, record, progress) {
  // One atomic statement saves both projections with one database round trip.
  await sql`
    WITH saved_player AS (
    INSERT INTO players (id, username, level, xp, coins, data, created_at)
    VALUES (${record.id}, ${record.username}, ${record.level}, ${record.xp}, ${record.coins}, ${typeof record.data==='string'?record.data:JSON.stringify(record.data)}::jsonb, ${record.created_at}::timestamp)
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

// Called inside the persistence lock only after a transaction committed.
function acknowledgeCommittedPlayer(player,snapshot){
 if(!player||!snapshot||String(player.id)!==String(snapshot.id))return false;
 const comparable=p=>{const r=toDbPlayerRecord(p);return {id:r.id,username:r.username,level:r.level,xp:r.xp,coins:r.coins,data:r.data};};
 if(!isDeepStrictEqual(comparable(player),comparable(snapshot)))return false;
 runtime.dirtyPlayerIds.delete(String(player.id));return true;
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
    await upsertPlayer(player,{serializeData:true});
    if ((runtime.dirtyRevision.get(id) || 0) === revision) runtime.dirtyPlayerIds.delete(id);
    count += 1;
  }
  if (count > 0) {
    gameDebugLog('[sql] player flush', {
      flushed: count,
      dirtyLeft: runtime.dirtyPlayerIds.size,
    });
  }
  return count;
}

// Targeted combat saves must not wait behind every other player's backlog.
const flushAllPlayers = createWriteQueue(flushDirtyPlayersNow);
const targetedFlushes = new Map();
function flushDirtyPlayers(playerIds = null) {
  if(!getDatabaseUrl() || !playerIds)return flushAllPlayers(playerIds);
  return Promise.all([...new Set(playerIds.map(String))].map(id=>{
    let entry=targetedFlushes.get(id);
    if(!entry){entry={run:createWriteQueue(()=>flushDirtyPlayersNow([id])),latest:null};targetedFlushes.set(id,entry);}
    const task=entry.run();entry.latest=task;
    task.finally(()=>{if(entry.latest===task&&targetedFlushes.get(id)===entry)targetedFlushes.delete(id)}).catch(()=>{});
    return task;
  })).then(counts=>counts.reduce((sum,count)=>sum+count,0));
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

// Identity changed (guest linked a wallet): move the in-memory session index entry.
function rekeyPlayerSession(player, previous = {}) {
  const oldKey = getPlayerSessionKey(previous);
  if (oldKey && runtime.playerBySessionKey.get(oldKey) === player) runtime.playerBySessionKey.delete(oldKey);
  const key = getPlayerSessionKey(player);
  if (key) runtime.playerBySessionKey.set(key, player);
}

function getPlayerBySession(session = {}) {
  const sessionKey = getPlayerSessionKey(session);
  if (!sessionKey) return null;
  return runtime.playerBySessionKey.get(sessionKey) || null;
}

async function init(store) {
  if (runtime.initialized) return runtime.players;
  if (runtime.initPromise) return runtime.initPromise;
  runtime.initPromise = initialize(store).then((players) => {
    runtime.initialized = true;
    return players;
  }).finally(() => { runtime.initPromise = null; });
  return runtime.initPromise;
}

async function initialize(store) {
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
  acknowledgeCommittedPlayer,
  addPlayer,
  getPlayerById,
  getPlayerBySession,
  rekeyPlayerSession,
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
