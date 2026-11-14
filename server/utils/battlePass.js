import { getEpicBattlePassItem } from '../../src/lib/epicBattlePassSet.js';
import { BP_ANIMATION_ITEMS, inventoryWithBattlePassAnimations } from '../../src/lib/battlePassAnimations.js';
import { getLegendaryBattlePassItem } from '../../src/lib/legendaryBattlePassSet.js';
import { BP_BOSS_DAILY_LIMIT, BP_DAYS, BP_LEVELS, BP_LEVEL_XP, BP_MAX_XP, BP_REWARDS, BP_TASKS, BP_TRACKS, bpTrackUnlocked, getBossVictoryXp } from '../../src/lib/battlePass.js';
import { getDayTasks } from '../../src/lib/questNotifications.js';

const DAY = 86400000;
export function battlePassEnabled() {
  return String(process.env.BATTLE_PASS_ENABLED ?? process.env.BATTLE_PASS_TEST_ENABLED ?? 'true').toLowerCase() !== 'false';
}
export function getBattlePassSeason() {
  const start = Date.parse(process.env.BATTLE_PASS_START || process.env.BATTLE_PASS_TEST_START || '2026-09-14T00:00:00Z');
  const date = new Date(start);
  if (!Number.isFinite(start) || date.getUTCDay() !== 1 || start % DAY !== 0) {
    throw new Error('Battle Pass season must start on Monday at 00:00 UTC');
  }
  return { id: `test-${date.toISOString().slice(0, 10)}`, start, end: Date.parse(process.env.BATTLE_PASS_END || (date.toISOString().slice(0, 10) === '2026-09-14' ? '2026-11-04T00:00:00Z' : new Date(start + BP_DAYS * DAY).toISOString())) };
}
const bucket = (key) => ({ key, metrics: {}, awarded: [] });
const positive = (value) => Math.max(0, Number(value) || 0);


function grantPassBackground(player, state, track, rewardType) {
  player.inventory_items = inventoryWithBattlePassAnimations(player);
  player.bp_background_rewards_separated = true;
  const backgroundId = `bp-${track}`;
  player.unlocked_backgrounds = [...new Set(['garage', ...(player.unlocked_backgrounds || []), backgroundId])];
  const id = `${state.seasonId}:${track}:${rewardType}`;
  state.items = [...(state.items || []).filter(entry => entry.id !== id), { id, type: rewardType, track, placeholder: false, backgroundId }];
  return true;
}
function grantPassAnimation(player, track) {
  const item = BP_ANIMATION_ITEMS.find(item => item.id === `bp_${track}_animation`);
  if (!(player.inventory_items || []).some(entry => entry.id === item.id)) player.inventory_items = [...(player.inventory_items || []), { ...item }];
}
function grantEpicEquipment(player, state, rewardType) {
  if (rewardType === 'epic_background') return grantPassBackground(player, state, 'epic', rewardType);
  if (rewardType === 'season_animation') {
    const id = state.seasonId + ':epic:season_animation';
    if (state.items?.some(entry => entry.id === id && entry.backgroundId === 'bp-epic')) player.unlocked_backgrounds = [...new Set([...(player.unlocked_backgrounds || []), 'bp-epic'])];
    grantPassAnimation(player, 'epic');
    state.items = [...(state.items || []).filter(entry => entry.id !== id), {id, type: rewardType, track: 'epic', placeholder: false, equipmentId: 'bp_epic_animation'}];
    return true;
  }
  const item = getEpicBattlePassItem(rewardType);
  if (!item) return false;
  state.items ||= [];
  const receiptId = state.seasonId + ':epic:' + rewardType;
  const receipt = state.items.find(entry => entry.id === receiptId);
  if (receipt && !receipt.placeholder && receipt.equipmentId === item.id) return true;
  const inventory = Array.isArray(player.inventory_items) ? player.inventory_items : [];
  if (!inventory.some(entry => entry.id === item.id && entry.type === 'equipment')) {
    player.inventory_items = [...inventory, { ...item, locked: false, count: 1 }];
  }
  const issued = { id: receiptId, type: rewardType, track: 'epic', placeholder: false, equipmentId: item.id };
  state.items = [...state.items.filter(entry => entry.id !== receiptId), issued];
  return true;
}

function grantLegendaryEquipment(player, state, rewardType) {
  if (rewardType === 'legendary_background') return grantPassBackground(player, state, 'legendary', rewardType);
  const receiptId = state.seasonId + ':legendary:' + rewardType;
  const receipt = (state.items || []).find(entry=>entry.id===receiptId);
  if (receipt && !receipt.placeholder) return true;
  if (rewardType === 'exclusive_animation') {
    if (receipt?.backgroundId === 'bp-legendary') player.unlocked_backgrounds = [...new Set([...(player.unlocked_backgrounds || []), 'bp-legendary'])];
    grantPassAnimation(player, 'legendary');
  } else {
    const item = getLegendaryBattlePassItem(rewardType);
    if (!item) return false;
    if (!(player.inventory_items || []).some(entry => entry.id === item.id)) player.inventory_items = [...(player.inventory_items || []), {...item, locked:false, count:1}];
  }
  const item = getLegendaryBattlePassItem(rewardType);
  const id = state.seasonId + ':legendary:' + rewardType;
  state.items = [...(state.items || []).filter(entry => entry.id !== id), {id,type:rewardType,track:'legendary',placeholder:false,equipmentId:item?.id || 'bp_legendary_animation'}];
  return true;
}
function prepare(player, now) {
  const season = getBattlePassSeason();
  let state = player.battle_pass;
  if (!state || state.seasonId !== season.id) {
    if (state) player.battle_pass_archive = { ...(player.battle_pass_archive || {}), [state.seasonId]: state };
    state = { seasonId: season.id, xp: 0, tier: 'free', claims: [], tickets: 0, items: [], season: bucket(season.id) };
  }
  // Copy before editing so profile proxies persist nested changes as one assignment.
  state = structuredClone(state);
  const previousItems = JSON.stringify(state.items || []);
  // Materialize previously claimed placeholders exactly once; do not repay currencies.
  for (const row of BP_REWARDS) {
    if ((state.claims || []).includes('legendary:' + row.level)) {
      for (const reward of row.legendary) grantLegendaryEquipment(player, state, reward.type);
    }
    if ((state.claims || []).includes('epic:' + row.level)) {
      for (const reward of row.epic) grantEpicEquipment(player, state, reward.type);
    }
  }
  player.inventory_items = inventoryWithBattlePassAnimations(player);
  const active = now >= season.start && now < season.end;
  if (active) {
    const day = Math.floor((now - season.start) / DAY);
    const week = Math.floor(day / 7);
    if (state.daily?.key !== day) state.daily = bucket(day);
    if (state.weekly?.key !== week) {
      state.weekly = bucket(week);
      state.dailyCompletions = [];
    }
  }
  state.daily ||= bucket(-1);
  state.weekly ||= bucket(-1);
  if (previousItems !== JSON.stringify(state.items || [])) player.battle_pass = state;
  return { state, season, active };
}
function add(state, metric, amount) {
  for (const scope of ['daily', 'weekly', 'season']) {
    state[scope].metrics[metric] = positive(state[scope].metrics[metric]) + positive(amount);
  }
}
function evaluate(state) {
  // Weekly first, so its completion can finish a seasonal objective immediately.
  for (const scope of ['daily', 'weekly', 'season']) {
    for (const task of BP_TASKS[scope]) {
      if (state[scope].awarded.includes(task.id) || positive(state[scope].metrics[task.metric]) < task.goal) continue;
      state[scope].awarded.push(task.id);
      state.xp = Math.min(BP_MAX_XP, state.xp + task.xp);
      if (scope === 'weekly') state.season.metrics.weekly = positive(state.season.metrics.weekly) + 1;
    }
  }
}
function evaluateDaily(player, state, now) {
  if (Number(player.level || 1) < 3) return;
  const day = new Date(now).getUTCDay() || 7;
  const dateKey = new Date(now).toISOString().slice(0, 10);
  // Only server-recorded events feed this mirror; generic profile PATCH cannot farm XP.
  const m = state.daily.metrics;
  const profile = {
    currentDateKey: dateKey,
    daily_event_last_claim: m.login ? dateKey : '',
    energy_spent_today: m.energy || 0,
    total_tasks_today: m.missions || 0,
    boss_hits_today: m.boss || 0,
    boss_damage_today: m.damage || 0,
    opened_boxes_total: state.season.metrics.boxes || 0,
    newbie_stats: { small_poison_uses: state.season.metrics.smallPoison || 0 },
    raid_boss_hits_today: m.raid || 0,
  };
  state.dailyCompletions ||= [];
  for (let unlockedDay = 1; unlockedDay <= day; unlockedDay += 1) {
    for (const task of getDayTasks(unlockedDay)) {
      if (task.dayLocked && unlockedDay !== day) continue;
      if (state.dailyCompletions.includes(task.id) || task.progress(profile) < task.goal) continue;
      state.dailyCompletions.push(task.id);
      add(state, 'daily', 1);
    }
  }
}
export function recordBattlePassEvent(player, event, now = Date.now()) {
  if (!battlePassEnabled()) return;
  const { state, active } = prepare(player, now);
  if (active) {
    if (event.type === 'login' && !state.daily.metrics.login) add(state, 'login', 1);
    if (event.type === 'mission' && event.success) {
      add(state, 'missions', 1);
      add(state, 'energy', event.energy);
      add(state, 'dm', event.dm);
    }
    if (event.type === 'missionSpend' && event.energy > 0) add(state, 'energy', event.energy);
    if (event.type === 'missionComplete' && event.count > 0) add(state, 'missions', event.count);
    if (event.type === 'boss' && event.damage > 0) {
      add(state, 'boss', 1); // one successful action, not multiplier/clan fan-out
      add(state, 'damage', event.damage);
      if (event.smallPoison) add(state, 'smallPoison', 1);
      if (event.raid) add(state, 'raid', 1);
    }
    if (event.type === 'box') add(state, 'boxes', 1);
    if (event.type === 'earnedDm' && ['boss', 'quest', 'reward', 'event', 'freePass'].includes(event.source)) add(state, 'dm', event.amount);
    evaluateDaily(player, state, now);
    evaluate(state);
  }
  player.battle_pass = state;
}
export function recordBattlePassBossVictory(player, fightId, bossIndex, now = Date.now()) {
  if (!battlePassEnabled()) return { awarded: false, xp: 0, killsToday: 0, limit: BP_BOSS_DAILY_LIMIT };
  const { state, active } = prepare(player, now);
  const fightKey = String(fightId || '');
  const baseResult = { awarded: false, xp: 0, killsToday: positive(state.daily.metrics.bossKills), limit: BP_BOSS_DAILY_LIMIT };
  if (!active || !fightKey || !getBossVictoryXp(bossIndex)) {
    player.battle_pass = state;
    return baseResult;
  }
  state.daily.bossFightIds ||= [];
  if (state.daily.bossFightIds.includes(fightKey) || baseResult.killsToday >= BP_BOSS_DAILY_LIMIT) {
    player.battle_pass = state;
    return baseResult;
  }
  const requestedXp = getBossVictoryXp(bossIndex);
  const xp = Math.min(requestedXp, Math.max(0, BP_MAX_XP - positive(state.xp)));
  state.daily.bossFightIds.push(fightKey);
  state.daily.metrics.bossKills = baseResult.killsToday + 1;
  state.daily.metrics.bossKillXp = positive(state.daily.metrics.bossKillXp) + xp;
  state.xp = Math.min(BP_MAX_XP, positive(state.xp) + xp);
  evaluate(state);
  player.battle_pass = state;
  return { awarded: xp > 0, xp, killsToday: state.daily.metrics.bossKills, limit: BP_BOSS_DAILY_LIMIT };
}
export function battlePassView(player, now = Date.now()) {
  if (!battlePassEnabled()) return null;
  const { state, season, active } = prepare(player, now);
  const level = Math.min(BP_LEVELS, Math.floor(state.xp / BP_LEVEL_XP));
  return {
    ...state, active, start: season.start, end: season.end, level,
    levelXp: level === BP_LEVELS ? BP_LEVEL_XP : state.xp % BP_LEVEL_XP,
    daysLeft: Math.max(0, Math.ceil((season.end - now) / DAY)),
    tasks: Object.fromEntries(Object.entries(BP_TASKS).map(([scope, tasks]) => [scope, tasks.map((task) => ({
      ...task, progress: Math.min(task.goal, positive(state[scope].metrics[task.metric])),
      done: state[scope].awarded.includes(task.id),
    }))])),
  };
}
export function claimBattlePassReward(player, { level, track }, now = Date.now()) {
  if (!battlePassEnabled()) throw new Error('Battle Pass is not available');
  const { state, active } = prepare(player, now);
  const row = BP_REWARDS.find((entry) => entry.level === level);
  if (!active || !row || level > Math.floor(state.xp / BP_LEVEL_XP) || !bpTrackUnlocked(state.tier, track)) throw new Error('Нагорода ще недоступна');
  const key = `${track}:${level}`;
  if (state.claims.includes(key)) return false;
  for (const reward of row[track]) {
    if (reward.type === 'dm') player.tentacles = positive(player.tentacles) + reward.amount;
    else if (reward.type === 'cdm') player.premium = positive(player.premium) + reward.amount;
    else if (reward.type === 'energy') {
      player.energy = positive(player.energy) + reward.amount;
      player.last_energy_update = new Date(now).toISOString();
    } else if (['large', 'medium'].includes(reward.type)) {
      const id = `${reward.type}-poison`;
      player.weapon_inventory = { ...(player.weapon_inventory || {}), [id]: positive(player.weapon_inventory?.[id]) + reward.amount };
    } else if (reward.type === 'ticket') state.tickets += reward.amount;
    else if (track === 'epic' && grantEpicEquipment(player, state, reward.type)) {}
    else if (track === 'legendary' && grantLegendaryEquipment(player, state, reward.type)) {}
    else state.items.push({ id: `${state.seasonId}:${track}:${reward.type}`, type: reward.type, track, placeholder: true });
    if (track === 'free' && reward.type === 'dm') add(state, 'dm', reward.amount);
  }
  state.claims.push(key);
  evaluate(state);
  player.battle_pass = state;
  return true;
}

export function unlockBattlePassTier(player, tier, now = Date.now()) {
  if (!battlePassEnabled()) throw new Error('Battle Pass is not available');
  const { state, active } = prepare(player, now);
  if (!active || !['epic', 'legendary'].includes(tier)) throw new Error('Battle Pass tier is unavailable');
  if (BP_TRACKS.indexOf(tier) > BP_TRACKS.indexOf(state.tier || 'free')) state.tier = tier;
  player.battle_pass = state;
  return state.tier;
}

export function fullyUnlockBattlePass(player, tier, now = Date.now()) {
  unlockBattlePassTier(player, tier, now);
  player.battle_pass = { ...player.battle_pass, xp: Math.max(positive(player.battle_pass.xp), BP_LEVELS * BP_LEVEL_XP) };
  return player.battle_pass;
}

export function claimAllBattlePassRewards(player, now = Date.now()) {
  const view = battlePassView(player, now);
  if (!view?.active) throw new Error('Battle Pass is not active');
  const available = BP_REWARDS.flatMap(row => row.level <= view.level
    ? BP_TRACKS.filter(track => bpTrackUnlocked(view.tier, track) && !view.claims.includes(track + ':' + row.level)).map(track => ({level:row.level, track}))
    : []);
  return available.filter(reward => claimBattlePassReward(player, reward, now));
}
