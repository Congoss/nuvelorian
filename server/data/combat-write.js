import { performance } from 'node:perf_hooks';
import { setImmediate as yieldToIO } from 'node:timers/promises';
import { createWriteQueue } from '../utils/writeQueue.js';
import { acquireKeyLock } from '../utils/keyLock.js';

// A combat reply is a confirmation: HP, damage and poison spending must already
// be committed when the player sees it, otherwise a crash between the reply and
// the write could roll confirmed damage back. Tap batching keeps this cheap (one
// commit per batch). The old reply-before-write mode is opt-in only.
export function useBackgroundCombatWrites() {
  return process.env.COMBAT_BACKGROUND_WRITES === '1';
}

export const combatWriteQueue = createWriteQueue(async () => {});

const pendingPlayerRecords = new Map();

export function rebasePendingCombatRecords(playerId, update) {
  for (const record of pendingPlayerRecords.get(String(playerId)) || []) update(record);
}

export function enqueueBackgroundCombatWrite(playerIds, save, records = []) {
  for (const record of records) {
    if (!pendingPlayerRecords.has(record.id)) pendingPlayerRecords.set(record.id, new Set());
    pendingPlayerRecords.get(record.id).add(record);
  }
  const stopRebasing = () => {
    for (const record of records) {
      const pending = pendingPlayerRecords.get(record.id);
      if (!pending) continue;
      pending.delete(record);
      if (!pending.size) pendingPlayerRecords.delete(record.id);
    }
  };
  const queuedAt = performance.now();
  // Reserve every affected player before the accepted result becomes visible.
  const reservations = Promise.all([...new Set(playerIds)].sort()
    .map(id => acquireKeyLock('persist-player:' + id)));
  return combatWriteQueue.exclusive(async () => {
    const releases = await reservations;
    try {
      await yieldToIO();
      stopRebasing();
      const started = performance.now();
      try { return await save(); }
      finally {
        const writeMs = performance.now() - started;
        const waitMs = started - queuedAt;
        if (writeMs >= 500 || waitMs >= 500) console.warn('[combat-background-write]', {
          pid: process.pid, wait_ms: Math.round(waitMs), write_ms: Math.round(writeMs),
        });
      }
    } finally {
      stopRebasing();
      for (const release of releases.reverse()) release();
    }
  });
}

const sqlPrefix = (strings, ...values) => ({ strings, values });

export async function lockShipCombatRows(sql, clanId, playerIds) {
  const [locked] = await sql`
    WITH locked_ship AS MATERIALIZED (
      SELECT state FROM clan_ship_state WHERE clan_id=${String(clanId)} FOR UPDATE
    ), locked_players AS MATERIALIZED (
      SELECT p.* FROM locked_ship CROSS JOIN players AS p
      WHERE p.id=ANY(${playerIds}::text[]) ORDER BY p.id FOR UPDATE OF p
    )
    SELECT state, (SELECT jsonb_agg(p ORDER BY p.id) FROM locked_players AS p) AS players FROM locked_ship
  `;
  if (!locked) throw new Error('SHIP_STATE_MISSING');
  if ((locked.players?.length || 0) !== playerIds.length) throw new Error('SHIP_PARTICIPANT_MISSING');
  return locked;
}

// A failed statement rolls back player inventory, progress and combat state together.
export async function saveCombatBatch(sql,{stateKey,state,stateChanged,players,mode,revision}){
 if(!stateChanged&&!players.length)return;
 if (!["ship", "world"].includes(mode)) throw new Error("Invalid combat storage mode");
 const encodeStarted = performance.now();
 const payload=JSON.stringify(players);
 const serializedState = stateChanged ? JSON.stringify(mode === 'world' ? [...new Map(state.map(entry => [entry.entity_type+':'+entry.entity_id,entry])).values()] : state) : null;
 const encodeMs = performance.now() - encodeStarted;
 if (encodeMs >= 20) {
  console.warn('[combat-write-encode]', { mode, encode_ms: Math.round(encodeMs),
   player_bytes: Buffer.byteLength(payload), state_bytes: Buffer.byteLength(serializedState || '') });
 }
 const playerWrites = sqlPrefix`
  WITH incoming AS (
   SELECT * FROM jsonb_to_recordset(${payload}::jsonb)
   AS entry(id TEXT,username TEXT,level INT,xp INT,coins INT,data JSONB,progress JSONB)
  ), saved_players AS (
   UPDATE players AS player SET username=entry.username,level=entry.level,xp=entry.xp,coins=entry.coins,data=entry.data
   FROM incoming AS entry WHERE player.id=entry.id RETURNING player.id
  ), saved_progress AS (
   INSERT INTO player_progress (player_id,progress,updated_at)
   SELECT entry.id,entry.progress,now() FROM incoming AS entry JOIN saved_players AS saved ON saved.id=entry.id
   ON CONFLICT (player_id) DO UPDATE SET progress=EXCLUDED.progress,updated_at=EXCLUDED.updated_at
   RETURNING player_id
  ), write_guard AS (
   SELECT 1 / CASE WHEN (SELECT COUNT(*) FROM saved_players) = (SELECT COUNT(*) FROM incoming)
    THEN 1 ELSE 0 END AS ok
  )
 `;
 const stateWrite = !stateChanged ? sqlPrefix`SELECT player_id FROM saved_progress CROSS JOIN write_guard WHERE write_guard.ok=1`
  : mode === 'ship'
   ? sqlPrefix`UPDATE clan_ship_state AS ship SET state=ship.state || (
         SELECT jsonb_object_agg(entry.key, COALESCE(ship.state->entry.key, '{}'::jsonb) || entry.value)
         FROM jsonb_each(${serializedState}::jsonb) AS entry
       ),updated_at=now() FROM write_guard WHERE clan_id=${String(stateKey)} AND write_guard.ok=1`
   : sqlPrefix`INSERT INTO world_combat_state (state_key,entity_type,entity_id,state,revision,updated_at)
      SELECT ${String(stateKey)},entry.entity_type,entry.entity_id,entry.state,${String(revision || '')},now()
      FROM jsonb_to_recordset(${serializedState}::jsonb) AS entry(entity_type TEXT,entity_id TEXT,state JSONB)
      CROSS JOIN write_guard WHERE write_guard.ok=1
      ON CONFLICT (state_key,entity_type,entity_id) DO UPDATE SET state=EXCLUDED.state,revision=EXCLUDED.revision,updated_at=EXCLUDED.updated_at`;
 const strings = [...playerWrites.strings];
 strings[strings.length - 1] += stateWrite.strings[0];
 await sql([...strings, ...stateWrite.strings.slice(1)], ...playerWrites.values, ...stateWrite.values);
}

export async function commitCombatWrite(sql, persist, getBatch) {
  try {
    return await persist();
  } catch (error) {
    const batch = getBatch();
    if (!batch || (!batch.stateChanged && !batch.players.length) || !await reconcileCombatWrite(sql, batch, error)) throw error;
  }
}

// Resolve ambiguous commit outcomes before an older snapshot can be flushed.
export async function reconcileCombatWrite(sql, batch, error, { wait = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const connectivity = value => /^(08|ECONN|EPIPE|ETIMEDOUT|57P0)/.test(String(value?.code || '')) || /connection|socket|timeout|terminated|network/i.test(String(value?.message || ''));
  if (!['world', 'ship'].includes(batch.mode) || !connectivity(error)) return false;
  const stateCheck = batch.mode === 'ship'
    ? sqlPrefix`(NOT ${Boolean(batch.stateChanged)} OR EXISTS (
        SELECT 1 FROM clan_ship_state AS ship WHERE clan_id=${String(batch.stateKey)} AND NOT EXISTS (
          SELECT 1 FROM jsonb_each(${JSON.stringify(batch.state)}::jsonb) AS section
          CROSS JOIN LATERAL jsonb_each(section.value) AS entry
          WHERE ship.state->section.key->entry.key IS DISTINCT FROM entry.value
        )
      ))`
    : sqlPrefix`NOT EXISTS (
        SELECT 1 FROM jsonb_to_recordset(${JSON.stringify(batch.state)}::jsonb)
          AS expected(entity_type TEXT,entity_id TEXT,state JSONB)
        LEFT JOIN world_combat_state AS actual ON actual.state_key=${String(batch.stateKey)}
          AND actual.entity_type=expected.entity_type AND actual.entity_id=expected.entity_id
        WHERE actual.state IS DISTINCT FROM expected.state
      )`;
  for (;;) {
    try {
      const playerCheck = sqlPrefix` AND NOT EXISTS (
            SELECT 1 FROM jsonb_to_recordset(${JSON.stringify(batch.players)}::jsonb)
              AS expected(id TEXT,username TEXT,level INT,xp INT,coins INT,data JSONB,progress JSONB)
            LEFT JOIN players AS actual ON actual.id=expected.id
            LEFT JOIN player_progress AS progress ON progress.player_id=expected.id
            WHERE actual.id IS NULL OR actual.data IS DISTINCT FROM expected.data
              OR actual.username IS DISTINCT FROM expected.username
              OR actual.level IS DISTINCT FROM expected.level OR actual.xp IS DISTINCT FROM expected.xp
              OR actual.coins IS DISTINCT FROM expected.coins OR progress.progress IS DISTINCT FROM expected.progress
          ) AS committed
      `;
      const strings = [...stateCheck.strings];
      strings[0] = 'SELECT ' + strings[0];
      strings[strings.length - 1] += playerCheck.strings[0];
      const rows = await sql([...strings, ...playerCheck.strings.slice(1)], ...stateCheck.values, ...playerCheck.values);
      return rows[0]?.committed === true;
    } catch (probeError) {
      if (!connectivity(probeError)) throw probeError;
      await wait(250);
    }
  }
}
