import { randomUUID, randomBytes } from 'node:crypto';
import { PVP_AI_PILOTS, chooseDuelAiMove, duelCommitment, pilotDisplayName } from './pvp-duel.js';
import { duelStats, DUEL_ACTIONS, DUEL_BEATS } from '../../src/lib/pvpDuel.js';
import { getEquipmentEnhancementLevels } from '../../src/lib/equipmentEnhancementPresentation.js';
import { PVP_SERIES_SIZE, PVP_COOLDOWN_MS, PVP_SEARCH_SECONDS, pvpRefillQuote } from '../../src/lib/pvpRanks.js';
import { getActiveBattlePassTier } from '../utils/battlePass.js';
import { chooseCachedPvpAiMove } from './pvp-near-ai.js';

export const ONLINE_ROUND_MS = 30_000;
export const ONLINE_QUEUE_MS = 45_000;
export const PVP_AI_FALLBACK_MS = PVP_SEARCH_SECONDS * 1000;
const fail = code => { throw Object.assign(new Error(code), { code, statusCode: 409 }); };
export const emptyOnlineState = () => ({ version: 1, profiles: {}, aiProfiles: {}, queue: [], matches: {} });
const name = player => String(player.nickname || player.username || 'Player').slice(0, 80);
const avatarUrl = player => player.avatar || player.photoUrl || player.avatar_url || player.photo_url || player.profile_photo_url || null;
const PILOT_BY_NAME = new Map(PVP_AI_PILOTS.map(pilot => [pilot.name, pilot]));
const aiDisplayName = (canonicalName, lang) => pilotDisplayName(PILOT_BY_NAME.get(canonicalName), lang) || canonicalName;
function stats(player) {
  const levels = getEquipmentEnhancementLevels(player);
  const inventory_items = (player.inventory_items || []).map(item => ({ ...item, enhancementLevel: levels[item.id] || 0 }));
  return duelStats({ ...player, inventory_items });
}
function progress(state, player, now) {
  const key = String(player.id);
  const p = state.profiles[key] ||= { rating: 0, attempts: PVP_SERIES_SIZE, readyAt: 0, history: [], name: name(player), matchId: null };
  p.name = name(player);
  p.avatar = avatarUrl(player);
  p.avatarFrameId = player.avatar_frame_id || player.selected_avatar_frame || null;
  p.profileHeaderTheme = player.profile_header_theme || null;
  p.battlePassTier = getActiveBattlePassTier(player, now);
  p.highestRating = Math.max(p.highestRating || 0, p.rating);
  p.hasVictory = Boolean(p.hasVictory || p.highestRating > 0 || p.history.some(h => h.result === 'win'));
  if (p.readyAt && p.readyAt <= now) {
    const restored = 1 + Math.floor((now - p.readyAt) / PVP_COOLDOWN_MS);
    p.attempts = Math.min(PVP_SERIES_SIZE, p.attempts + restored);
    p.readyAt = p.attempts === PVP_SERIES_SIZE ? 0 : p.readyAt + restored * PVP_COOLDOWN_MS;
  }
  return p;
}
function spendAttempt(p, now) {
  p.attempts--;
  if (p.paidReserve > 0) { p.attempts++; p.paidReserve--; }
  if (!p.readyAt && p.attempts < PVP_SERIES_SIZE) p.readyAt = now + PVP_COOLDOWN_MS;
}
export function creditPvpRefill(state, player, orderId, attempts, now = Date.now()) {
  if (!orderId || !Number.isInteger(attempts) || attempts < 1 || attempts > PVP_SERIES_SIZE) fail('PVP_REFILL_INVALID');
  state.aiProfiles ||= {};
  const p = progress(state, player, now); p.refillReceipts ||= {};
  if (p.refillReceipts[orderId]) return;
  const total = p.attempts + attempts;
  p.attempts = Math.min(PVP_SERIES_SIZE, total); p.paidReserve = (p.paidReserve || 0) + Math.max(0, total - PVP_SERIES_SIZE);
  if (p.attempts === PVP_SERIES_SIZE) p.readyAt = 0;
  p.refillReceipts[orderId] = { attempts, at: now };
}
function finish(state, match, winner, reason, now) {
  if (match.status !== 'active') return;
  match.status = 'finished'; match.winner = winner; match.reason = reason; match.finishedAt = now;
  const lookup = f => f.kind === 'ai' ? (state.aiProfiles[f.id] ||= { rating: f.rating || 0, name: f.name, history: [] }) : state.profiles[f.id];
  const ratings = match.fighters.map(f => lookup(f).rating);
  match.fighters.forEach((f, i) => {
    const p = lookup(f), result = winner === null ? 'draw' : winner === i ? 'win' : 'loss';
    const points = Math.round(20 + 5 / (1 + 10 ** ((ratings[i] - ratings[1 - i]) / 400)));
    const next = Math.max(0, p.rating + (result === 'win' ? points : result === 'loss' ? -points : 0));
    f.ratingDelta = next - p.rating; p.rating = next;
    p.highestRating = Math.max(p.highestRating || 0, p.rating);
    if (result === 'win') p.hasVictory = true;
    p.history.unshift({ id: match.id, opponent: match.fighters[1 - i].name, opponentKind: match.fighters[1 - i].kind || 'human', result, delta: f.ratingDelta, at: now });
    p.history = p.history.slice(0, 12);
  });
}
function commitAi(match, random) {
  const learned = chooseCachedPvpAiMove(match.id, random);
  const choice = learned || chooseDuelAiMove(match.ai.pilot, match.history.map(h => ({ playerChoice: h.choices[0] })), random);
  match.ai.provider = learned ? 'near-ai' : 'local';
  const nonce = randomBytes(20).toString('hex');
  match.choices[1] = choice;
  match.ai.nonce = nonce;
  match.ai.commitment = duelCommitment(match.id, match.round, choice, nonce);
}
function startAi(state, entry, now, random, lang) {
  const p = state.profiles[entry.id];
  if (!p.attempts) fail('PVP_COOLDOWN');
  const pilot = PVP_AI_PILOTS[Math.floor(random() * PVP_AI_PILOTS.length) % PVP_AI_PILOTS.length];
  const botId = 'ai:' + pilot.name;
  const bot = state.aiProfiles[botId] ||= { rating: 0, name: pilot.name, history: [] };
  const opponent = { ...entry.stats, attack: Math.max(1, Math.round(entry.stats.attack * (1 + pilot.bias))), maxHp: Math.max(1, Math.round(entry.stats.maxHp * (1 + pilot.bias))) };
  const match = { id: randomUUID(), status: 'active', round: 1, choices: {}, history: [], deadline: now + ONLINE_ROUND_MS, expiresAt: now + 15 * 60_000,
    ai: { pilot: { ...pilot } }, fighters: [
      { id: entry.id, name: p.name, stats: entry.stats, hp: entry.stats.maxHp },
      { id: botId, name: pilotDisplayName(pilot, lang), kind: 'ai', style: pilot.style, rating: bot.rating, stats: opponent, hp: opponent.maxHp },
    ] };
  commitAi(match, random);
  state.matches[match.id] = match; p.matchId = match.id; spendAttempt(p, now);
  state.queue = state.queue.filter(e => e.id !== entry.id);
  return match;
}
function sweep(state, now) {
  state.queue = state.queue.filter(entry => now - entry.seenAt < ONLINE_QUEUE_MS);
  for (const match of Object.values(state.matches)) {
    if (match.status === 'active' && (match.deadline <= now || match.expiresAt <= now)) {
      const moves = Object.keys(match.choices);
      finish(state, match, moves.length === 1 ? Number(moves[0]) : null, 'timeout', now);
    }
    if (match.status === 'finished' && now - match.finishedAt > 3600_000) {
      for (const f of match.fighters) if (state.profiles[f.id]?.matchId === match.id) state.profiles[f.id].matchId = null;
      delete state.matches[match.id];
    }
  }
}
function publicMatch(match, id) {
  if (!match) return null;
  const i = match.fighters.findIndex(f => f.id === id);
  if (i < 0) fail('DUEL_FORBIDDEN');
  const mine = match.fighters[i], enemy = match.fighters[1 - i];
  const visible = f => ({ id: f.id, name: f.name, ...f.stats, hp: f.hp });
  return {
    id: match.id, kind: 'online', status: match.status, round: match.round, ranked: true,
    player: visible(mine), opponent: { ...visible(enemy), kind: enemy.kind || 'human', ...(enemy.style ? { style: enemy.style } : {}) },
    ...(match.ai ? { commitment: match.ai.commitment, aiProvider: match.ai.provider || 'local' } : {}),
    ratingDelta: mine.ratingDelta || 0,
    result: match.status === 'finished' ? match.winner === null ? 'draw' : match.winner === i ? 'win' : 'loss' : null,
    reason: match.reason, deadline: match.deadline, expiresAt: match.expiresAt,
    submitted: Object.hasOwn(match.choices, i), selectedChoice: match.choices[i] || null,
    opponentReady: Object.hasOwn(match.choices, 1 - i),
    history: match.history.map(h => ({ round: h.round, playerChoice: h.choices[i], opponentChoice: h.choices[1 - i], damage: h.damage, winner: h.winner === null ? 'draw' : h.winner === i ? 'player' : 'opponent', ...(h.commitment ? { commitment: h.commitment, nonce: h.nonce } : {}) })),
  };
}
export function onlineDuelCommand(state, player, body, now = Date.now(), random = Math.random, findPlayerById = null) {
  if (!player?.id) fail('AUTH_REQUIRED');
  if (state.version !== 1) fail('PVP_STATE_VERSION');
  state.aiProfiles ||= {};
  sweep(state, now);
  const id = String(player.id), p = progress(state, player, now), action = body?.action || 'state';
  let match = state.matches[p.matchId];
  if (action === 'queue') {
    if (match?.status !== 'active') {
      if (!p.attempts) fail('PVP_COOLDOWN');
      const existing = state.queue.find(e => e.id === id);
      const mine = existing || { id, stats: stats(player), joinedAt: now, seenAt: now };
      mine.seenAt = now;
      if (!existing) {
        if (state.queue.length >= 1000) fail('PVP_QUEUE_FULL');
        state.queue.push(mine);
      }
      const candidate = state.queue.find(e => {
        if (e.id === id || !state.profiles[e.id]?.attempts || state.matches[state.profiles[e.id].matchId]?.status === 'active') return false;
        const strength = s => s.attack * s.maxHp;
        const ratio = Math.max(strength(e.stats), strength(mine.stats)) / Math.max(1, Math.min(strength(e.stats), strength(mine.stats)));
        const waited = now - Math.min(e.joinedAt, mine.joinedAt);
        return ratio <= (waited >= 5_000 ? 4 : 2) && Math.abs(state.profiles[e.id].rating - p.rating) <= 200 + Math.floor(waited / 1000) * 10;
      });
      if (candidate) {
        const entries = [candidate, mine];
        match = { id: randomUUID(), status: 'active', round: 1, choices: {}, history: [], deadline: now + ONLINE_ROUND_MS, expiresAt: now + 15 * 60_000,
          fighters: entries.map(e => ({ id: e.id, name: state.profiles[e.id].name, stats: e.stats, hp: e.stats.maxHp })) };
        state.matches[match.id] = match;
        for (const e of entries) {
          const profile = state.profiles[e.id]; profile.matchId = match.id; spendAttempt(profile, now);
        }
        state.queue = state.queue.filter(e => !entries.some(p => p.id === e.id));
      }
    }
  } else if (action === 'cancel') {
    state.queue = state.queue.filter(e => e.id !== id);
  } else if (action === 'choose') {
    if (!match || match.id !== body.matchId) fail('WRONG_DUEL');
    if (!DUEL_ACTIONS.includes(body.choice) || !Number.isInteger(body.round)) fail('INVALID_CHOICE');
    const i = match.fighters.findIndex(f => f.id === id), prior = match.history.find(h => h.round === body.round);
    if (prior) { if (prior.choices[i] !== body.choice) fail('ROUND_ALREADY_PLAYED'); }
    else {
      if (match.status !== 'active' || match.round !== body.round) fail('STALE_ROUND');
      if (Object.hasOwn(match.choices, i) && match.choices[i] !== body.choice) fail('ROUND_ALREADY_PLAYED');
      match.choices[i] = body.choice;
      if (Object.keys(match.choices).length === 2) {
        const choices = [match.choices[0], match.choices[1]];
        const winner = choices[0] === choices[1] ? null : DUEL_BEATS[choices[0]] === choices[1] ? 0 : 1;
        const damage = winner === null ? 0 : match.fighters[winner].stats.attack;
        if (winner !== null) match.fighters[1 - winner].hp = Math.max(0, match.fighters[1 - winner].hp - damage);
        match.history.push({ round: match.round, choices, winner, damage, ...(match.ai ? { commitment: match.ai.commitment, nonce: match.ai.nonce } : {}) }); match.choices = {};
        if (match.fighters.some(f => f.hp === 0)) finish(state, match, match.fighters[0].hp ? 0 : 1, 'defeat', now);
        else if (match.round >= 30) finish(state, match, null, 'round_limit', now);
        else { match.round++; match.deadline = now + ONLINE_ROUND_MS; if (match.ai) commitAi(match, random); }
      }
    }
  } else if (action === 'abandon') {
    if (!match || match.id !== body.matchId) fail('WRONG_DUEL');
    const i = match.fighters.findIndex(f => f.id === id);
    finish(state, match, 1 - i, 'abandoned', now);
  } else if (action !== 'state') fail('UNKNOWN_ACTION');
  let queued = state.queue.find(e => e.id === id);
  if (queued && ['state', 'queue'].includes(action) && now - queued.joinedAt >= PVP_AI_FALLBACK_MS && match?.status !== 'active') {
    match = startAi(state, queued, now, random, player.language); queued = null;
  }
  if (queued) queued.seenAt = now;
  const ranked = [...Object.entries(state.profiles), ...Object.entries(state.aiProfiles)].filter(([, p]) => p.history.length).sort((a, b) => b[1].rating - a[1].rating || a[0].localeCompare(b[0]));
  const own = ranked.findIndex(([key]) => key === id);
  const leaders = ranked.slice(0, 100); if (own >= 100) leaders.push(ranked[own]);
  return {
    match: publicMatch(match, id), queue: queued ? { status: 'searching', joinedAt: queued.joinedAt, fallbackAt: queued.joinedAt + PVP_AI_FALLBACK_MS, expiresAt: queued.seenAt + ONLINE_QUEUE_MS } : null,
    progress: { rating: p.rating, highestRating: p.highestRating, hasVictory: p.hasVictory, claimedRanks: Object.keys(player.pvp_rank_rewards || {}).map(Number), refill: pvpRefillQuote(p.attempts), attempts: p.attempts, readyAt: p.readyAt, serverTime: now, history: p.history, leaders: leaders.map(([key, row]) => {
      if (key.startsWith('ai:')) return { name: aiDisplayName(row.name, player.language), kind: 'ai', position: ranked.findIndex(([id]) => id === key) + 1, rating: row.rating, self: key === id };
      const live = findPlayerById?.(key);
      const name2 = live ? name(live) : row.name;
      const avatar2 = live ? avatarUrl(live) : row.avatar;
      const avatarFrameId2 = live ? (live.avatar_frame_id || live.selected_avatar_frame || null) : row.avatarFrameId;
      const profileHeaderTheme2 = live ? (live.profile_header_theme || null) : row.profileHeaderTheme;
      const battlePassTier2 = live ? getActiveBattlePassTier(live, now) : (row.battlePassTier || 'free');
      return { name: name2, kind: 'human', position: ranked.findIndex(([id]) => id === key) + 1, rating: row.rating, self: key === id, id: key, avatar: avatar2 || null, avatarFrameId: avatarFrameId2 || null, profileHeaderTheme: profileHeaderTheme2 || null, battlePassTier: battlePassTier2 || 'free' };
    }) },
  };
}
