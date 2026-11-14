import { saveWorldSnapshot, mergeWorldCombatSnapshot } from './world-combat-checkpoint.js';
import { randomUUID } from 'node:crypto';
import { RAID_BOSS_EVENT_KEY, RAID_BOSS_MAX_HP, isCurrentRaidBoss, migrateRaidBossHealth } from '../../src/lib/raidBossConfig.js';
import { EVENT_SCHEDULE } from '../../src/lib/eventSchedule.js';
import { getPostgresSql } from './postgres.js';
import { readLocalState, saveLocalState } from './local-state.js';
import {restoreLocalMarketState} from '../utils/localMarketState.js';
import { createWriteQueue } from '../utils/writeQueue.js';
import { saveCombatBatch, commitCombatWrite, combatWriteQueue, enqueueBackgroundCombatWrite } from './combat-write.js';

const DATABASE_URL_KEYS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
];

const STATE_KEY = 'planet4:state:v2';
const allowAuthoritativeMigration = String(process.env.ALLOW_AUTHORITATIVE_MIGRATION || '').trim().toLowerCase() === 'true';

const runtime = {
  sql: null,
  store: null,
  saveTimer: null,
  initPromise: null,
  combatCheckpoints: new Map(),
  pendingClanIds: new Set(),
  clanSaveTimer: null,
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

function cloneEmptyState() {
  return {
    players: [],
    clans: [],
    bossFights: [],
    bossDamageLogs: [],
    attackLogs: [],
    claimedLoot: [],
    walletLinks: [],
    tonProofSessions: [],
    chatMessages: [],
    raidBoss: null,
    lootBoxTables: {},
    bossRewardConfig: null,
    promoCodes: [],
    customLootBoxes: [],
    partners: [],
    newsCampaigns: [],
    cardGames: {},
    supportReports: [],
    adminMailLog: [],
    nftHolderCampaign: null,
    nftHolderDrops: [],
    nftPetClaims: [],
  };
}

function createRaidBoss() {
  return {
    id: 'global-raid-boss',
    event_key: RAID_BOSS_EVENT_KEY,
    name: 'Raid Boss',
    max_hp: RAID_BOSS_MAX_HP,
    current_hp: RAID_BOSS_MAX_HP,
    status: 'active',
    participants: {},
    started_at: EVENT_SCHEDULE['raid-boss'].startAt,
    ends_at: EVENT_SCHEDULE['raid-boss'].endAt,
  };
}

function normalizeState(parsed, fallback = cloneEmptyState()) {
  return {
    players: Array.isArray(parsed?.players) ? parsed.players : fallback.players,
    clans: Array.isArray(parsed?.clans) ? parsed.clans : fallback.clans,
    bossFights: Array.isArray(parsed?.bossFights) ? parsed.bossFights : fallback.bossFights,
    bossDamageLogs: Array.isArray(parsed?.bossDamageLogs) ? parsed.bossDamageLogs : fallback.bossDamageLogs,
    attackLogs: Array.isArray(parsed?.attackLogs) ? parsed.attackLogs : fallback.attackLogs,
    claimedLoot: Array.isArray(parsed?.claimedLoot) ? parsed.claimedLoot : fallback.claimedLoot,
    walletLinks: Array.isArray(parsed?.walletLinks) ? parsed.walletLinks : fallback.walletLinks,
    tonProofSessions: Array.isArray(parsed?.tonProofSessions) ? parsed.tonProofSessions : fallback.tonProofSessions,
    chatMessages: Array.isArray(parsed?.chatMessages) ? parsed.chatMessages : fallback.chatMessages,
    raidBoss: parsed?.raidBoss && typeof parsed.raidBoss === 'object' ? migrateRaidBossHealth(parsed.raidBoss) : createRaidBoss(),
    lootBoxTables: parsed?.lootBoxTables && typeof parsed.lootBoxTables === 'object' ? parsed.lootBoxTables : {},
    bossRewardConfig: parsed?.bossRewardConfig && typeof parsed.bossRewardConfig === 'object' ? parsed.bossRewardConfig : null,
    promoCodes: Array.isArray(parsed?.promoCodes) ? parsed.promoCodes : [],
    customLootBoxes: Array.isArray(parsed?.customLootBoxes) ? parsed.customLootBoxes : [],
    partners: Array.isArray(parsed?.partners) ? parsed.partners : [],
    newsCampaigns: Array.isArray(parsed?.newsCampaigns) ? parsed.newsCampaigns : [],
    supportReports: Array.isArray(parsed?.supportReports)?parsed.supportReports:[],
    cardGames: parsed?.cardGames && typeof parsed.cardGames==='object' ? parsed.cardGames : {},
    adminMailLog: Array.isArray(parsed?.adminMailLog) ? parsed.adminMailLog : [],
    nftHolderCampaign: parsed?.nftHolderCampaign && typeof parsed.nftHolderCampaign === 'object' ? parsed.nftHolderCampaign : null,
    nftHolderDrops: Array.isArray(parsed?.nftHolderDrops) ? parsed.nftHolderDrops : [],
    nftPetClaims: Array.isArray(parsed?.nftPetClaims) ? parsed.nftPetClaims : [],
  };
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyStateToStore(target, state) {
  const next = normalizeState(state, cloneEmptyState());
  target.players = Array.isArray(target.players) ? target.players : [];
  target.clans = next.clans;
  target.bossFights = next.bossFights;
  target.bossDamageLogs = next.bossDamageLogs;
  target.attackLogs = next.attackLogs;
  target.claimedLoot = next.claimedLoot;
  target.walletLinks = next.walletLinks;
  target.tonProofSessions = next.tonProofSessions;
  target.chatMessages = next.chatMessages;
  target.raidBoss = next.raidBoss;
  target.lootBoxTables = next.lootBoxTables;
  target.bossRewardConfig = next.bossRewardConfig;
  target.promoCodes = next.promoCodes;
  target.customLootBoxes = next.customLootBoxes;
  target.partners = next.partners;
  target.newsCampaigns = next.newsCampaigns;
  target.cardGames = next.cardGames;
  target.supportReports=next.supportReports;
  target.adminMailLog = next.adminMailLog;
  target.nftHolderCampaign = next.nftHolderCampaign;
  target.nftHolderDrops = next.nftHolderDrops;
  target.nftPetClaims = next.nftPetClaims;
  return next;
}

function getPersistentStateSnapshot(source) {
  return normalizeState({
    clans: source.clans.map(({ship, ...clan}) => clan),
    bossFights: source.bossFights,
    bossDamageLogs: source.bossDamageLogs,
    attackLogs: source.attackLogs,
    claimedLoot: source.claimedLoot,
    walletLinks: source.walletLinks,
    tonProofSessions: source.tonProofSessions,
    chatMessages: source.chatMessages,
    raidBoss: source.raidBoss,
    lootBoxTables: source.lootBoxTables,
    bossRewardConfig: source.bossRewardConfig,
    promoCodes: source.promoCodes,
    customLootBoxes: source.customLootBoxes,
    partners: source.partners,
    newsCampaigns: source.newsCampaigns,
    cardGames: source.cardGames,
    supportReports:source.supportReports,
    adminMailLog: source.adminMailLog,
    nftHolderCampaign: source.nftHolderCampaign,
    nftHolderDrops: source.nftHolderDrops,
    nftPetClaims: source.nftPetClaims,
  }, cloneEmptyState());
}

async function ensureSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS game_state (
      key TEXT PRIMARY KEY,
      state JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS world_combat_state (
      state_key TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
      state JSONB NOT NULL, revision TEXT NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT now(),
      PRIMARY KEY (state_key,entity_type,entity_id)
    )
  `;
}

async function loadState() {
  const sql = getSql();
  // Ship history has its own durable table; keep only current combat state here.
  await sql`CREATE TABLE IF NOT EXISTS clan_ship_state (clan_id TEXT PRIMARY KEY,state JSONB NOT NULL DEFAULT '{}'::jsonb,updated_at TIMESTAMP NOT NULL DEFAULT now())`;
  const rows = await sql`
    SELECT state, COALESCE((SELECT jsonb_agg(jsonb_build_object('entity_type',entry.entity_type,'entity_id',entry.entity_id,'state',entry.state,'revision',entry.revision))
      FROM world_combat_state AS entry WHERE entry.state_key=${STATE_KEY}), '[]'::jsonb) AS combat
    FROM game_state
    WHERE key = ${STATE_KEY}
    LIMIT 1
  `;
  const state = rows[0]?.state || cloneEmptyState();
  for (const entry of rows[0]?.combat || []) runtime.combatCheckpoints.set(entry.entity_type + ':' + entry.entity_id, entry.revision);
  mergeWorldCombatSnapshot(state, rows[0]?.combat || []);
  const ships = await sql`SELECT clan_id,state FROM clan_ship_state`;
  const shipsById = new Map(ships.map(row => [String(row.clan_id),row.state]));
  for (const clan of state.clans || []) {
    if (shipsById.has(String(clan.id))) clan.ship = shipsById.get(String(clan.id));
    else if (clan.ship) {
      // Preserve a legacy ship before excluding its duplicate from world saves.
      await sql`INSERT INTO clan_ship_state (clan_id,state) VALUES (${String(clan.id)},${JSON.stringify(clan.ship)}::jsonb) ON CONFLICT (clan_id) DO NOTHING`;
    }
  }
  return state;
}

async function saveState(state) {
  const sql = getSql();
  const snapshot = normalizeState(state, cloneEmptyState());
  // Completed combat history is immutable and already present in the base
  // snapshot. New and changed fight rows live in world_combat_state, so a
  // routine save never serializes ~94 MB of historical fights and damage logs.
  const compact = compactWorldSnapshot(snapshot);
  await saveWorldSnapshot(sql, STATE_KEY, compact);
  return snapshot;
}

export function compactWorldSnapshot(snapshot) {
  const compact = { ...snapshot };
  delete compact.bossFights;
  delete compact.bossDamageLogs;
  return compact;
}

const queueStateSave = createWriteQueue(async () => {
  await saveState(getPersistentStateSnapshot(store));
  return true;
});


export const store = {
  players: [],
  clans: [],
  bossFights: [],
  bossDamageLogs: [],
  attackLogs: [],
  claimedLoot: [],
  walletLinks: [],
  tonProofSessions: [],
  chatMessages: [],
  raidBoss: createRaidBoss(),
  lootBoxTables: {},
  bossRewardConfig: null,
  promoCodes: [],
  customLootBoxes: [],
  adminMailLog: [],
  nftHolderCampaign: null,
  nftHolderDrops: [],
  nftPetClaims: [],
  newsCampaigns: [],
  cardGames: {},
    supportReports: [],
  generateId,
  async init() {
    if (runtime.initPromise) return runtime.initPromise;
    runtime.initPromise = (async () => {
      // A local preview can run without Postgres. Production still requires
      // persistent storage because this branch is only used when no URL exists.
      if (!getDatabaseUrl()) {
        if (process.env.NODE_ENV === 'production' && process.env.SECURITY_AUDIT_SYNTHETIC !== 'true') throw new Error('DATABASE_URL is required in production');
        const state = readLocalState() || cloneEmptyState();
        const resetRaidBoss = !isCurrentRaidBoss(state.raidBoss);
        applyStateToStore(this, state);
        restoreLocalMarketState(this,state);
        this.players = Array.isArray(state.players) ? state.players : [];
        runtime.store = this;
        if (resetRaidBoss) await this.persistNow();
        return state;
      }
      await ensureSchema();
      const state = await loadState();
      const resetRaidBoss = !isCurrentRaidBoss(state.raidBoss);
      applyStateToStore(this, state);
      runtime.store = this;
      if (resetRaidBoss) await this.persistNow();
      return state;
    })().catch(error => {
      runtime.initPromise = null;
      throw error;
    });
    return runtime.initPromise;
  },
  async persistNow() {
    // An explicit save already includes changes waiting for the background
    // timer. Cancel that redundant pass before capturing the current snapshot.
    // Calls arriving during this save can still schedule their own next pass.
    if(runtime.saveTimer){clearTimeout(runtime.saveTimer);runtime.saveTimer=null;}
    if (!getDatabaseUrl()) return saveLocalState(this);
    return queueStateSave();
  },
  queueCombatCommit(work) {
    return combatWriteQueue.exclusive(() => work(async (draft, players, changes) => {
      if (getDatabaseUrl()) {
        const batch = { mode: 'world', stateKey: STATE_KEY, stateChanged: changes.length > 0,
          state: changes, players, revision: randomUUID() };
        const sql = getSql();
        await commitCombatWrite(sql, () => saveCombatBatch(sql, batch), () => batch);
        return () => { for (const entry of changes) runtime.combatCheckpoints.set(entry.entity_type + ':' + entry.entity_id, batch.revision); };
      } else if (process.env.LOCAL_GAME_STATE_PATH && !saveLocalState(draft)) {
        throw new Error('Combat state could not be saved');
      }
    }));
  },
  // Legacy response mode is restricted to a single authoritative game process.
  queueCombatInBackground(work) {
    return work(async (_draft, players, changes) => {
      const batch = structuredClone({ mode: 'world', stateKey: STATE_KEY, stateChanged: changes.length > 0,
        state: changes, players, revision: randomUUID() });
      void enqueueBackgroundCombatWrite(players.map(player => player.id), async () => {
        if (getDatabaseUrl()) {
          const sql = getSql();
          await commitCombatWrite(sql, () => saveCombatBatch(sql, batch), () => batch);
          for (const entry of changes) runtime.combatCheckpoints.set(entry.entity_type + ':' + entry.entity_id, batch.revision);
        } else if (process.env.LOCAL_GAME_STATE_PATH && !saveLocalState(store)) {
          throw new Error('Combat state could not be saved');
        }
      }, batch.players).catch(error => console.error('[combat] background world write failed', error));
    });
  },
  persistWorldEntities(entries) {
    if (!Array.isArray(entries) || !entries.length || this.combatDraft) return;
    const changes = entries.map(entry => structuredClone(entry));
    void this.queueCombatInBackground(async save => {
      await save(this, [], changes);
    }).catch(error => console.error('[world-checkpoint] background write failed', error));
  },
  persistClanSoon(clanId) {
    if (this.combatDraft) return;
    if (!getDatabaseUrl()) { this.persistSoon(); return; }
    runtime.pendingClanIds.add(String(clanId));
    if (runtime.clanSaveTimer) return;
    runtime.clanSaveTimer = setTimeout(() => {
      runtime.clanSaveTimer = null;
      const ids = [...runtime.pendingClanIds]; runtime.pendingClanIds.clear();
      void this.queueCombatCommit(async save => {
        const changes = ids.map(id => this.clans.find(clan => String(clan.id) === id)).filter(Boolean)
          .map(({ship, ...clan}) => ({ entity_type: 'clans', entity_id: String(clan.id), state: JSON.parse(JSON.stringify(clan)) }));
        if (!changes.length) return;
        const register = await save(this, [], changes); register?.();
      }).catch(error => {
        console.error('[clan-checkpoint]', error.message);
        for (const id of ids) this.persistClanSoon(id);
      });
    }, 100);
    runtime.clanSaveTimer.unref?.();
  },
  async refreshRaidBoss() {
    if (!getDatabaseUrl()) return this.raidBoss;
    const previous = this.raidBoss;
    const sql = getSql();
    const rows = await sql`
      SELECT COALESCE((SELECT state FROM world_combat_state WHERE state_key=${STATE_KEY} AND entity_type='raidBoss' AND entity_id='raidBoss'),state->'raidBoss') AS raid_boss
      FROM game_state
      WHERE key = ${STATE_KEY}
      LIMIT 1
    `;
    const raidBoss = rows[0]?.raid_boss;
    if (this.raidBoss !== previous) return this.raidBoss;
    if (raidBoss && typeof raidBoss === 'object') {
      const reset = !isCurrentRaidBoss(raidBoss);
      this.raidBoss = migrateRaidBossHealth(raidBoss);
      if (reset) await this.persistNow();
    }
    return this.raidBoss;
  },
  persistSoon(delayMs = 350) {
    if (this.combatDraft) return;
    if (runtime.saveTimer) return;
    runtime.saveTimer = setTimeout(() => {
      runtime.saveTimer = null;
      this.persistNow().catch((error) => {
        console.error('[postgres-state]', {
          operation: 'persistSoon.failed',
          message: error?.message || 'unknown_error',
        });
      });
    }, delayMs);
    if (typeof runtime.saveTimer.unref === 'function') runtime.saveTimer.unref();
  },
  async restoreAuthoritativeState(state) {
    if (!allowAuthoritativeMigration) {
      throw new Error('Authoritative migration restore is disabled');
    }
    await ensureSchema();
    const next = normalizeState(state, cloneEmptyState());
    applyStateToStore(this, next);
    await saveState(next);
    return next;
  },
  canWritePersistentState() {
    return Boolean(getDatabaseUrl());
  },
  canRestoreAuthoritativeState() {
    return Boolean(getDatabaseUrl()) && allowAuthoritativeMigration;
  },
};
