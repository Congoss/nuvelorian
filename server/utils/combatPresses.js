// A batch carries several button presses in one HTTP round trip. Every press is
// still resolved by the normal single-attack handler, in order, on the same
// combat draft, so talent procs, armor rolls and inventory checks keep their
// per-press behaviour. The draft is committed once for the whole batch.
export const MAX_COMBAT_PRESSES = 50;
const MULTIPLIERS = new Set([1, 5, 10, 100]);

export function parseCombatPresses(body) {
  if (!body || !Object.hasOwn(body, 'presses')) return null;
  const presses = body.presses;
  if (!Array.isArray(presses) || presses.length < 1 || presses.length > MAX_COMBAT_PRESSES) {
    return { error: 'INVALID_COMBAT_PRESSES' };
  }
  const parsed = [];
  for (const press of presses) {
    const weaponId = typeof press?.weaponId === 'string' ? press.weaponId.trim() : '';
    const multiplier = press?.multiplier === undefined ? 1 : Number(press.multiplier);
    if (!weaponId || weaponId.length > 64 || !MULTIPLIERS.has(multiplier)) return { error: 'INVALID_COMBAT_PRESSES' };
    parsed.push({ weaponId, multiplier });
  }
  return { presses: parsed };
}

function captureResponse() {
  return {
    statusCode: 0, headers: {}, body: '',
    writeHead(statusCode, headers) { this.statusCode = statusCode; this.headers = headers || {}; },
    end(value) { this.body = value; },
    setHeader() {},
    getHeader() { return undefined; },
  };
}

function readError(body) {
  try {
    const parsed = JSON.parse(body);
    return { code: parsed.code || 'API_ERROR', message: parsed.message || '' };
  } catch {
    return { code: 'API_ERROR', message: '' };
  }
}

// runPress(response, pressBody) is the unchanged single-press handler.
export function runCombatPresses(response, presses, runPress, baseBody = {}) {
  const results = [];
  let rejected = null;
  let headers = null;
  for (let index = 0; index < presses.length; index += 1) {
    const sub = captureResponse();
    runPress(sub, { ...baseBody, presses: undefined, weaponId: presses[index].weaponId, multiplier: presses[index].multiplier });
    if (!sub.statusCode) throw new Error('Combat press returned no response');
    if (sub.statusCode >= 400) {
      if (!results.length) {
        // Nothing was accepted: answer exactly like a single rejected press.
        response.diagnosticCode = readError(sub.body).code;
        response.writeHead(sub.statusCode, sub.headers);
        response.end(sub.body);
        return;
      }
      rejected = { index, ...readError(sub.body) };
      break;
    }
    headers = sub.headers;
    const data = JSON.parse(sub.body).data;
    results.push(data);
    if (data?.fight && data.fight.status !== 'active') {
      if (index < presses.length - 1) rejected = { index: index + 1, code: 'BOSS_FIGHT_FINISHED', message: '' };
      break;
    }
  }
  const last = results[results.length - 1];
  const hits = results.map(result => result.hit || null);
  const merged = {
    ...last,
    hit: {
      ...(last.hit || {}),
      damage: hits.reduce((sum, hit) => sum + Number(hit?.damage || 0), 0),
      isCrit: hits.some(hit => hit?.isCrit === true),
      boneCurseApplied: hits.some(hit => hit?.boneCurseApplied === true),
    },
    hits,
    processed: results.length,
    rejected,
    rewardSummary: results.find(result => result.rewardSummary)?.rewardSummary || null,
    clanAssists: results.flatMap(result => Array.isArray(result.clanAssists) ? result.clanAssists : []),
    xpGranted: results.reduce((sum, result) => sum + Number(result.xpGranted || 0), 0),
    leaderboard: results.findLast(result => result.leaderboard)?.leaderboard,
  };
  if (!merged.leaderboard) delete merged.leaderboard;
  if (!merged.clanAssists.length) merged.clanAssists = last.clanAssists ?? null;
  if (merged.fight) response.combatSnapshotInfo = {
    fight_id: merged.fight.id, revision: merged.fight.combat_revision, hp: merged.fight.current_hp,
    player_id: merged.player?.id, poison: { ...merged.player?.weapon_inventory },
  };
  response.writeHead(200, headers || { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify({ data: merged }, (key, value) => key === 'x_oauth' ? undefined : value));
}
