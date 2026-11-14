import { recordBossTimeoutAchievement } from './playerAchievements.js';
import {activeBossFights,activeBossFightsByOwners} from './combatIndexes.js';
export function applyBossTimeTalent(fight, player) {
  if (!fight || fight.status !== 'active' || String(fight.opened_by_email || '').toLowerCase() !== String(player?.created_by || '').toLowerCase()) return;
  const started = Date.parse(fight.started_at || '');
  if (!Number.isFinite(started)) return;
  const level = Number(player?.talent_tree_version || 0) >= 2 ? Math.min(10, Math.max(0, Number(player?.talent_levels?.t47) || 0)) : 0;
  const applied = Math.max(Number(fight.time_talent_level || 0), level);
  fight.time_talent_level = applied;
  fight.ends_at = new Date(started + 6 * 3600000 + applied * 30 * 60000).toISOString();
}

function normalizeClanId(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeClanName(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function getOwnerKey(value) {
  return String(value ?? '').trim().toLowerCase();
}

/**
 * Returns true only when both players resolve to the same clan.
 * Clan IDs are authoritative when both are present; legacy profiles may use
 * a normalized clan name when either ID is absent.
 */
export function arePlayersClanMates(attacker, candidate) {
  if (!attacker || !candidate) return false;

  const attackerClanId = normalizeClanId(attacker.clan_id);
  const candidateClanId = normalizeClanId(candidate.clan_id);

  if (attackerClanId && candidateClanId) {
    return attackerClanId === candidateClanId;
  }

  const attackerClanName = normalizeClanName(attacker.clan_name);
  const candidateClanName = normalizeClanName(candidate.clan_name);
  return Boolean(attackerClanName && candidateClanName && attackerClanName === candidateClanName);
}

export function isActiveBossFight(fight) {
  return Boolean(
    fight &&
    String(fight.status || '').trim().toLowerCase() === 'active' &&
    Number(fight.current_hp) > 0,
  );
}

export function shouldReceiveBossFightDamageReward(fight, log, playerId = log?.player_id) {
  if (!fight || !log?.player_email) return false;
  const playerEmail = String(log.player_email).trim().toLowerCase();
  const ownerEmail = String(fight.opened_by_email || '').trim().toLowerCase();
  if (!ownerEmail || playerEmail === ownerEmail) return true;
  return Boolean(playerId) && (fight.invited_player_ids || []).map(String).includes(String(playerId));
}

export function expireStaleBossFights(fights = [], now = Date.now(), players = []) {
  let expired = 0;
  const owners = new Map();
  for (const player of players) {
    const key = String(player.created_by || '').toLowerCase();
    if (!owners.has(key)) owners.set(key, player);
  }
  for (const fight of activeBossFights(fights)) {
    if (fight?.status !== 'active') continue;
    const owner = owners.get(String(fight.opened_by_email || '').toLowerCase());
    if (owner) applyBossTimeTalent(fight, owner);
    const startedAt = Date.parse(fight?.started_at || '');
    const deadline = Date.parse(fight?.ends_at || '') || startedAt + 6 * 3600000;
    if (fight?.status !== 'active' || !Number.isFinite(startedAt) || now < deadline) continue;
    fight.status = 'expired';
    recordBossTimeoutAchievement(fight, players, now);
    fight.ended_at = new Date(now).toISOString();
    expired += 1;
  }
  return expired;
}

/**
 * Selects the personal fights that receive one clan-shared hit.
 * The selected source fight is preserved even when it is no longer active;
 * all additional targets must be active and owned by a clan mate.
 */
export function getClanDamageFightTargets({ attacker, sourceFight, fights, players } = {}) {
  const targets = [];
  const seenFightIds = new Set();
  const seenAnonymousFights = new Set();

  const addTarget = (fight) => {
    if (!fight || typeof fight !== 'object') return;

    const fightId = String(fight.id ?? '').trim();
    if (fightId) {
      if (seenFightIds.has(fightId)) return;
      seenFightIds.add(fightId);
    } else {
      if (seenAnonymousFights.has(fight)) return;
      seenAnonymousFights.add(fight);
    }

    targets.push(fight);
  };

  // The requested fight stays first and is never filtered out by fan-out rules.
  addTarget(sourceFight);
  if (sourceFight?.solo === true) return targets;

  const ownersByEmail = new Map();
  for (const player of Array.isArray(players) ? players : []) {
    const ownerKey = getOwnerKey(player?.created_by);
    if (ownerKey) ownersByEmail.set(ownerKey, player);
  }

  const clanOwners=Array.from(ownersByEmail).filter(([,owner])=>arePlayersClanMates(attacker,owner)).map(([email])=>email);
  for (const fight of activeBossFightsByOwners(Array.isArray(fights) ? fights : [],clanOwners)) {
    if (!isActiveBossFight(fight)) continue;
    if (fight.solo === true) continue;

    const owner = ownersByEmail.get(getOwnerKey(fight.opened_by_email));
    if (!owner || !arePlayersClanMates(attacker, owner)) continue;

    addTarget(fight);
  }

  return targets;
}
