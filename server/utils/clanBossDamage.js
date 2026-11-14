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

export function shouldReceiveBossFightDamageReward(fight, log) {
  if (!fight || !log?.player_email) return false;
  const playerEmail = String(log.player_email).trim().toLowerCase();
  const ownerEmail = String(fight.opened_by_email || '').trim().toLowerCase();
  if (!ownerEmail || playerEmail === ownerEmail) return true;
  return Array.isArray(fight.invited_player_ids) && fight.invited_player_ids.length > 0;
}

export function expireStaleBossFights(fights = [], now = Date.now()) {
  let expired = 0;
  for (const fight of fights) {
    const startedAt = Date.parse(fight?.started_at || '');
    if (fight?.status !== 'active' || !Number.isFinite(startedAt) || now - startedAt < 6 * 3600000) continue;
    fight.status = 'expired';
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

  const ownersByEmail = new Map();
  for (const player of Array.isArray(players) ? players : []) {
    const ownerKey = getOwnerKey(player?.created_by);
    if (ownerKey) ownersByEmail.set(ownerKey, player);
  }

  for (const fight of Array.isArray(fights) ? fights : []) {
    if (!isActiveBossFight(fight)) continue;

    const owner = ownersByEmail.get(getOwnerKey(fight.opened_by_email));
    if (!owner || !arePlayersClanMates(attacker, owner)) continue;

    addTarget(fight);
  }

  return targets;
}
