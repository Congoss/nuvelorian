export const RAID_BOSS_MAX_HP = 30_000_000;
export const RAID_BOSS_START_AT = '2026-10-15T08:28:00.000Z';
export const RAID_BOSS_DURATION_DAYS = 7;
export const RAID_BOSS_EVENT_KEY = `raid-boss:${RAID_BOSS_START_AT}`;

export function isCurrentRaidBoss(raid) {
  return raid?.event_key === RAID_BOSS_EVENT_KEY;
}

export function migrateRaidBossHealth(raid) {
  if (!raid || isCurrentRaidBoss(raid)) return raid;
  return {
    id: 'global-raid-boss',
    event_key: RAID_BOSS_EVENT_KEY,
    name: 'Raid Boss',
    max_hp: RAID_BOSS_MAX_HP,
    current_hp: RAID_BOSS_MAX_HP,
    status: 'active',
    participants: {},
    started_at: RAID_BOSS_START_AT,
    ends_at: new Date(Date.parse(RAID_BOSS_START_AT) + RAID_BOSS_DURATION_DAYS * 86400000).toISOString(),
  };
}
