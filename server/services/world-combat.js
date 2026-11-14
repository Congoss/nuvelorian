import { useBackgroundCombatWrites } from '../data/combat-write.js';
import { getClanDamageFightTargets } from '../utils/clanBossDamage.js';
import { activeBossFights, bossDamageLogsForFights, findBossDamageLog, findBossFight } from '../utils/combatIndexes.js';
import { isDeepStrictEqual } from 'node:util';
import { withKeyLocks } from '../utils/keyLock.js';
import {cloneCombatPlayer,compactCombatReceipt} from '../utils/combatReceipt.js';

const clone = value => JSON.parse(JSON.stringify(value));
const worldFields = ['clans', 'bossFights', 'bossDamageLogs', 'claimedLoot', 'raidBoss'];
const sameId = (a, b) => String(a) === String(b);
const clanKey = value => String(value || '').trim().toLowerCase();
const clanDraft = ({ship, ...fields}) => ({...clone(fields), ship});

function participants(store, actorId, scope) {
  const actor = store.players.find(p => sameId(p.id, actorId));
  const ids = new Set([String(actorId)]), fightIds = new Set();
  let targets = [], raid = scope === 'raid';
  if (scope.startsWith('boss:')) {
    const sourceFight = findBossFight(store.bossFights, scope.slice(5));
    targets = getClanDamageFightTargets({attacker:actor,sourceFight,fights:store.bossFights,players:store.players});
  } else if (scope === 'bleed') {
    for (const player of store.players) for (const [id,state] of Object.entries(player.talent_combat_state || {})) {
      if (!state?.bleed) continue;
      ids.add(String(player.id));
      if (id.startsWith('raid:')) raid = true; else fightIds.add(id);
    }
    targets = [...fightIds].map(id=>findBossFight(store.bossFights,id)).filter(Boolean);
  }
  const emails = new Set();
  for (const fight of targets) {
    if (!fight) continue;
    fightIds.add(String(fight.id)); emails.add(String(fight.opened_by_email || '').toLowerCase());
    for (const id of [...(fight.invited_player_ids || []),...Object.keys(fight.participants || {}),...Object.keys(fight.achievement_combat?.contributors || {})]) ids.add(String(id));
  }
  const damageLogs = bossDamageLogsForFights(store.bossDamageLogs,fightIds);
  for (const log of damageLogs) emails.add(String(log.player_email || '').toLowerCase());
  const raidContributors = Object.keys(store.raidBoss?.achievement_combat?.contributors || {});
  if (raid && raidContributors.length <= 10) for (const id of raidContributors) ids.add(String(id));
  for (const player of store.players) if (emails.has(String(player.created_by || '').toLowerCase())) ids.add(String(player.id));
  // An attack can expire clan quests or pay a hit/damage quest. Players who
  // have neither an affected fight nor an active quest do not need a lock.
  const affectedClans = new Set(store.players.filter(player => ids.has(String(player.id)))
    .map(player => clanKey(player.clan_id || player.clan_name)).filter(Boolean));
  for (const clan of store.clans) {
    if (!affectedClans.has(clanKey(clan.id)) && !affectedClans.has(clanKey(clan.name))) continue;
    for (const quest of clan.quests || []) {
      if (quest.status !== 'ACTIVE') continue;
      if (quest.owner_id) ids.add(String(quest.owner_id));
      if (quest.type === 'hits' || quest.type === 'damage') {
        for (const id of quest.participants || []) ids.add(String(id));
      }
    }
  }
  return { ids:[...ids], fightIds, targets, damageLogs, raid };
}

function applyChanges(live, before, after) {
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (isDeepStrictEqual(before[key], after[key])) continue;
    if (Object.hasOwn(after, key)) live[key] = after[key];
    else delete live[key];
  }
}

function publishWorld(store, before, after, originals, changedRows) {
  for (const field of worldFields) {
    if (!changedRows.has(field)) continue;
    if (!Array.isArray(after[field])) { store[field]=after[field]; continue; }
    for (const index of changedRows.get(field)) {
      const row=after[field][index], previous=before[field][index];
      const matches = candidate => field==='bossDamageLogs' && row.fight_id && row.player_email
        ? candidate.fight_id===row.fight_id && candidate.player_email===row.player_email
        : sameId(candidate.id,row.id);
      const indexed=originals[field]?.[index];
      const live=indexed && matches(indexed) ? indexed : field==='bossDamageLogs' && row.fight_id && row.player_email
        ? findBossDamageLog(store[field],row.fight_id,row.player_email)
        : field==='bossFights' ? findBossFight(store[field],row.id) : store[field].find(matches);
      if (live && previous) applyChanges(live,previous,row);
      else if (!live) store[field].push(row);
    }
  }
}

// Existing combat code runs synchronously on isolated drafts. Only one durable
// statement publishes its inventory, HP, damage logs and retry receipt together.
export async function executeWorldCombat(options) {
  const { store, playerDb, actorId, body, scope, calculate, onPlayerCommitted, onTiming } = options;
  const started = performance.now();
  const measure = (name, since) => onTiming?.(name, performance.now() - since);
  const {ids} = participants(store, actorId, scope);
  const selectionDone = performance.now();
  measure('combat_select', started);
  const result = await withKeyLocks(ids.map(id => 'action-player:' + id), () => {
    const actionLockedAt = performance.now();
    measure('combat_action_lock', selectionDone);
    const background = useBackgroundCombatWrites();
    const run = () => {
      const queuedAt = performance.now();
      measure('combat_persist_lock', actionLockedAt);
      measure('combat_locks', selectionDone);
      const runCombat = background ? store.queueCombatInBackground : store.queueCombatCommit;
      return runCombat.call(store, async save => {
        const draftStarted = performance.now();
        measure('combat_queue', queuedAt);
        const selected = new Set(ids);
        const current = participants(store, actorId, scope);
        if (current.ids.some(id => !selected.has(id))) return { retrySelection: true };
        const beforePlayers = new Map(store.players.filter(p => selected.has(String(p.id))).map(p => [String(p.id), p]));
        const liveActor = beforePlayers.get(String(actorId));
        if (!liveActor) throw Object.assign(new Error('Player session not found'), { statusCode: 401, code: 'AUTH_REQUIRED' });
        const requestId = String(body.requestId || '');
        if (requestId.length > 128) throw Object.assign(new Error('Invalid request id'), { statusCode: 400, code: 'INVALID_REQUEST_ID' });
        const fingerprint = JSON.stringify([scope, scope === 'raid' ? store.raidBoss?.id : null, body.weaponId, Number(body.multiplier) || 1, ...(Array.isArray(body.presses) ? [body.presses.map(press => [press?.weaponId, Number(press?.multiplier) || 1])] : [])]);
        const previous = requestId && liveActor.combat_receipts?.find(entry => entry.id === requestId);
        if (previous) {
          if (previous.fingerprint !== fingerprint) throw Object.assign(new Error('Attack request id already used'), { statusCode: 409, code: 'COMBAT_REQUEST_CONFLICT' });
          return compactCombatReceipt(previous).response;
        }
        const issuedAt = Number(/^combat:(\d+):/.exec(requestId)?.[1] || 0);
        if (requestId && ((liveActor.combat_retired_requests || []).includes(requestId)
          || issuedAt > 0 && issuedAt <= Number(liveActor.combat_request_floor || 0))) {
          throw Object.assign(new Error('This attack was already committed; refresh the battle'), { statusCode: 409, code: 'COMBAT_REQUEST_EXPIRED' });
        }
        const playersStarted = performance.now();
        measure('combat_reselect_receipt', draftStarted);
        const drafts = new Map([...beforePlayers].map(([id, player]) => [id, cloneCombatPlayer(player)]));
        const snapshotStarted = performance.now();
        measure('combat_clone_players', playersStarted);
        const actor = drafts.get(String(actorId));
        const live = Object.fromEntries(worldFields.map(field => [field, store[field]]));
        const activeIds = current.fightIds;
        const fullSnapshot = process.env.NODE_ENV !== 'production' && Boolean(process.env.LOCAL_GAME_STATE_PATH);
        const originals = {
          clans: live.clans,
          bossFights: fullSnapshot ? live.bossFights : [...new Set([...current.targets, ...activeBossFights(live.bossFights)])],
          bossDamageLogs: fullSnapshot ? live.bossDamageLogs : current.damageLogs,
        };
        const clanKeys = new Set([...drafts.values()].flatMap(player => [clanKey(player.clan_id), clanKey(player.clan_name)]));
        const draft = { ...store,
          clans: store.clans.map(clan => clanKeys.has(clanKey(clan.id)) || clanKeys.has(clanKey(clan.name)) ? clanDraft(clan) : clan),
          bossFights: originals.bossFights.map(fight => activeIds.has(String(fight.id)) ? clone(fight) : fight),
          bossDamageLogs: originals.bossDamageLogs.map(log => activeIds.has(String(log.fight_id)) ? clone(log) : log),
          claimedLoot: store.claimedLoot.slice(), raidBoss: current.raid ? clone(store.raidBoss) : store.raidBoss,
          players: store.players.map(p => drafts.get(String(p.id)) || p) };
        const before = { raidBoss: current.raid ? clone(live.raidBoss) : live.raidBoss, claimedLoot: live.claimedLoot.slice() };
        for (const field of ['clans','bossFights','bossDamageLogs']) before[field] = originals[field].map((row, index) => draft[field][index] === row ? row : field === 'clans' ? clanDraft(row) : clone(row));
        const calculateStarted = performance.now();
        measure('combat_clone_world', snapshotStarted);
        const livePlayers = store.players;
        const response = {
          statusCode: 0, headers: {}, body: '',
          writeHead(statusCode, headers) { this.statusCode = statusCode; this.headers = headers; },
          end(value) { this.body = value; },
        };
        try {
          for (const field of worldFields) store[field] = draft[field];
          store.players = draft.players;
          store.combatDraft = true;
          store.combatFightIds = activeIds;
          const returned = calculate(response);
          if (returned?.then) throw new Error('Combat calculation must be synchronous');
          for (const field of worldFields) draft[field] = store[field];
        } finally {
          for (const field of worldFields) store[field] = live[field];
          store.players = livePlayers;
          delete store.combatDraft;
          delete store.combatFightIds;
        }
        const changesStarted = performance.now();
        measure('combat_calculate_encode', calculateStarted);
        if (!response.statusCode) throw new Error('Combat calculation returned no response');
        if (response.statusCode >= 400) return response;
        if (requestId) {
          const receipts = actor.combat_receipts || [];
          const retired = [...(actor.combat_retired_requests || []), ...receipts.slice(0, Math.max(0, receipts.length - 7)).map(entry => entry.id)];
          for (const id of retired.slice(0, Math.max(0, retired.length - 512))) {
            const timestamp = Number(/^combat:(\d+):/.exec(id)?.[1] || 0);
            actor.combat_request_floor = Math.max(Number(actor.combat_request_floor || 0), timestamp);
          }
          actor.combat_retired_requests = retired.slice(-512);
          actor.combat_receipts = [...receipts.slice(-7).map(compactCombatReceipt), compactCombatReceipt({ id: requestId, fingerprint, response: { statusCode: response.statusCode, headers: response.headers, body: response.body } })];
        }
        const playerPatches = new Map();
        const changed = [];
        for (const [id, player] of drafts) {
          const original = beforePlayers.get(id);
          const keys = [...new Set([...Object.keys(original), ...Object.keys(player)])]
            .filter(key => Object.hasOwn(original, key) !== Object.hasOwn(player, key) || !isDeepStrictEqual(original[key], player[key]));
          if (!keys.length) continue;
          changed.push([id, player]);
          playerPatches.set(id, keys);
        }
        const toRecord = player => {
          const record = playerDb.toDbPlayerRecord(player);
          return { id: record.id, username: record.username, level: record.level, xp: record.xp, coins: record.coins, data: record.data, progress: playerDb.buildPlayerProgress(player) };
        };
        const records = changed.map(([, player]) => toRecord(player));
        const changes = [];
        const changedRows = new Map();
        for (const field of ['clans','bossFights','bossDamageLogs']) {
          const indexes = [];
          changedRows.set(field, indexes);
          for (let index=0; index<draft[field].length; index++) {
            const row=draft[field][index], previous=before[field][index];
            // Legacy archives may contain reused row IDs. Compare the actual
            // original row, so untouched history never becomes a combat write.
            if (isDeepStrictEqual(previous,row)) continue;
            indexes.push(index);
            const {ship, ...clanState} = field === 'clans' ? row : {};
            const id=field==='bossDamageLogs' && row.fight_id && row.player_email
              ? JSON.stringify([row.fight_id,row.player_email]) : String(row.id);
            changes.push({entity_type:field,entity_id:id,state:field==='clans'?clanState:row});
          }
        }
        if (!isDeepStrictEqual(before.claimedLoot, draft.claimedLoot)) {
          changedRows.set('claimedLoot', draft.claimedLoot.flatMap((row, index) =>
            isDeepStrictEqual(row, before.claimedLoot[index]) ? [] : [index]));
        }
        if (!isDeepStrictEqual(before.raidBoss, draft.raidBoss)) {
          changedRows.set('raidBoss', null);
          changes.push({ entity_type: 'raidBoss', entity_id: 'raidBoss', state: draft.raidBoss });
        }
        const uniqueChanges = [...new Map(changes.map(entry => [entry.entity_type+':'+entry.entity_id,entry])).values()];
        const saveStarted = performance.now();
        measure('combat_diff_receipts', changesStarted);
        measure('combat_prepare', draftStarted);
        let registerCommitted;
        try {
          if (changed.length || changes.length) registerCommitted = await save(draft, records, uniqueChanges);
        } finally {
          measure('combat_commit', saveStarted);
        }
        const publishStarted = performance.now();
        publishWorld(store, before, draft, originals, changedRows);
        for (const [id, player] of changed) {
          const target = store.players.find(p => sameId(p.id, id));
          for (const key of playerPatches.get(id)) {
            if (Object.hasOwn(player,key)) target[key]=player[key]; else delete target[key];
          }
          if (!background) playerDb.acknowledgeCommittedPlayer(target, player);
          onPlayerCommitted?.(target);
        }
        registerCommitted?.();
        measure('combat_publish', publishStarted);
        return response;
      });
    };
    return background ? run() : withKeyLocks(ids.map(id => 'persist-player:' + id), run);
  });
  return result.retrySelection ? executeWorldCombat(options) : result;
}
