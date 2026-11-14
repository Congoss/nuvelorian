import { RAID_BOSS_EVENT_KEY, RAID_BOSS_MAX_HP, isCurrentRaidBoss, migrateRaidBossHealth } from '../../src/lib/raidBossConfig.js';
import { EVENT_SCHEDULE } from '../../src/lib/eventSchedule.js';
import { getPostgresSql } from './postgres.js';
import { readLocalState, saveLocalState } from './local-state.js';

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
  savePromise: Promise.resolve(),
  initPromise: null,
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
  target.adminMailLog = next.adminMailLog;
  target.nftHolderCampaign = next.nftHolderCampaign;
  target.nftHolderDrops = next.nftHolderDrops;
  target.nftPetClaims = next.nftPetClaims;
  return next;
}

function getPersistentStateSnapshot(source) {
  return normalizeState({
    clans: source.clans,
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
}

async function loadState() {
  const sql = getSql();
  const rows = await sql`
    SELECT state
    FROM game_state
    WHERE key = ${STATE_KEY}
    LIMIT 1
  `;
  return rows[0]?.state || cloneEmptyState();
}

async function saveState(state) {
  const sql = getSql();
  const snapshot = normalizeState(state, cloneEmptyState());
  await sql`
    INSERT INTO game_state (key, state, updated_at)
    VALUES (${STATE_KEY}, ${JSON.stringify(snapshot)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET
      state = EXCLUDED.state,
      updated_at = EXCLUDED.updated_at
  `;
  return snapshot;
}

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
    })();
    return runtime.initPromise;
  },
  async persistNow() {
    if (!getDatabaseUrl()) return saveLocalState(this);
    runtime.savePromise = runtime.savePromise.catch(() => {}).then(async () => {
      const snapshot = getPersistentStateSnapshot(this);
      await saveState(snapshot);
      return true;
    });
    return runtime.savePromise;
  },
  async refreshRaidBoss() {
    if (!getDatabaseUrl()) return this.raidBoss;
    const sql = getSql();
    const rows = await sql`
      SELECT state->'raidBoss' AS raid_boss
      FROM game_state
      WHERE key = ${STATE_KEY}
      LIMIT 1
    `;
    const raidBoss = rows[0]?.raid_boss;
    if (raidBoss && typeof raidBoss === 'object') {
      const reset = !isCurrentRaidBoss(raidBoss);
      this.raidBoss = migrateRaidBossHealth(raidBoss);
      if (reset) await this.persistNow();
    }
    return this.raidBoss;
  },
  persistSoon(delayMs = 350) {
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
