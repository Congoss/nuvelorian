export function getFriday13BossName(language = 'uk') { return language === 'en' ? 'Camp Butcher' : language === 'ru' ? 'Мясник лагеря' : 'Різник табору'; }
export const RAID_BOSS_MAX_HP = 100_000_000;
export const RAID_BOSS_START_AT = '2026-11-13T16:42:00.000Z';
export const RAID_BOSS_END_AT = '2026-11-16T10:00:00.000Z';
export const RAID_BOSS_DURATION_DAYS = (Date.parse(RAID_BOSS_END_AT) - Date.parse(RAID_BOSS_START_AT)) / 86400000;
export const RAID_BOSS_EVENT_KEY = `raid-boss:${RAID_BOSS_START_AT}`;

export function isCurrentRaidBoss(raid) {
  return raid?.event_key === RAID_BOSS_EVENT_KEY;
}

export function migrateRaidBossHealth(raid) {
  if (!raid) return raid;
  if (isCurrentRaidBoss(raid)) {
    if (Number(raid.max_hp) === RAID_BOSS_MAX_HP) return raid;
    const damage = Math.max(0, Number(raid.max_hp || 0) - Number(raid.current_hp || 0));
    return { ...raid, max_hp: RAID_BOSS_MAX_HP, current_hp: ['dead','defeated'].includes(raid.status) ? 0 : Math.max(0, RAID_BOSS_MAX_HP - damage) };
  }
  return {
    id: 'global-raid-boss',
    event_key: RAID_BOSS_EVENT_KEY,
    name: 'Raid Boss',
    max_hp: RAID_BOSS_MAX_HP,
    current_hp: RAID_BOSS_MAX_HP,
    status: 'active',
    participants: {},
    started_at: RAID_BOSS_START_AT,
    ends_at: RAID_BOSS_END_AT,
  };
}
