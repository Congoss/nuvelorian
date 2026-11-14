import { RAID_BOSS_START_AT, RAID_BOSS_END_AT, RAID_BOSS_DURATION_DAYS } from './raidBossConfig.js';
export const EVENT_START_AT = '2026-10-07T15:00:00.000Z';
export const EVENT_SCHEDULE = Object.freeze({
  'raid-boss': { startAt: RAID_BOSS_START_AT, endAt: RAID_BOSS_END_AT, days: RAID_BOSS_DURATION_DAYS },
  'space-fishing': { startAt: EVENT_START_AT, endAt: null, days: null },
});
export function eventPhase(id, now = Date.now()) {
  const event = EVENT_SCHEDULE[id];
  if (!event) return 'unknown';
  return now < Date.parse(event.startAt) ? 'upcoming' : !event.endAt || now < Date.parse(event.endAt) ? 'active' : 'ended';
}
export function eventCountdown(id, now, language = 'uk') {
  const phase = eventPhase(id, now);
  const copy = language === 'en' ? ['Starts in', 'Ends in', 'Ended', 'd'] : language === 'ru' ? ['До старта', 'До завершения', 'Завершено', 'д'] : ['До старту', 'До завершення', 'Завершено', 'д'];
  if (phase === 'ended') return copy[2];
  const event = EVENT_SCHEDULE[id];
  if (phase === 'active' && !event.endAt) return '';
  const seconds = Math.max(0, Math.ceil((Date.parse(phase === 'upcoming' ? event.startAt : event.endAt) - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const clock = [Math.floor(seconds % 86400 / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
  return `${copy[phase === 'upcoming' ? 0 : 1]}: ${days ? `${days}${copy[3]} ` : ''}${clock}`;
}
