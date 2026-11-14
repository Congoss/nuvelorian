import { getQuestMission } from '../../src/lib/questMissionCatalog.js';

export const PASSIVE_INTERVAL_MS = 4 * 3600000;
const slugs = ['scout', 'loot', 'repair', 'trade', 'fight', 'cache', 'final'];
export function passiveReward(player) {
  const total = { tentacles: 0, xp: 0, strength: 0, percent: 0 };
  for (let index = 0; index < 8; index += 1) {
    const tasks = slugs.map(slug => getQuestMission(`p4-u0${index}-${slug}`));
    const clears = Math.min(...tasks.map(task => Math.floor(Number(player.task_completions?.[task.id] || 0) / task.target)));
    if (clears < 1) continue;
    const percent = 49 + clears;
    total.percent += percent;
    for (const key of ['tentacles', 'xp', 'strength']) total[key] += Math.floor(tasks.reduce((sum, task) => sum + task[key], 0) * percent / 100);
  }
  return total;
}
export function ensurePassiveTimer(player, now = Date.now()) {
  if (!passiveReward(player).percent) return;
  if (Number.isFinite(Date.parse(player.location_passive_ready_at?.global))) return;
  const last = Date.parse(player.location_passive_last_claim_at);
  const legacy = Object.values(player.location_passive_ready_at || {}).map(Date.parse).filter(Number.isFinite);
  const ready = Number.isFinite(last) ? last + PASSIVE_INTERVAL_MS : legacy.length ? Math.min(...legacy) : now + PASSIVE_INTERVAL_MS;
  player.location_passive_ready_at = { global: new Date(ready).toISOString() };
}
export function claimPassiveReward(player, now = Date.now()) {
  ensurePassiveTimer(player, now);
  const reward = passiveReward(player);
  if (!reward.percent || !(Date.parse(player.location_passive_ready_at?.global) <= now)) {
    const error = new Error('AFK reward is not ready');
    error.code = 'AFK_NOT_READY'; error.statusCode = 409;
    throw error;
  }
  player.location_passive_last_claim_at = new Date(now).toISOString();
  player.location_passive_ready_at = { global: new Date(now + PASSIVE_INTERVAL_MS).toISOString() };
  return reward;
}
