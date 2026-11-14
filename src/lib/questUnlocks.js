export const QUEST_LOCATION_UNLOCKS = {
  'p4-u00': null,
  'p4-u01': { bossId: 'heli', fallbackLevel: 20 },
  'p4-u02': { bossId: 'tank', fallbackLevel: 30 },
  'p4-u03': { bossId: 'chinook', fallbackLevel: 40 },
  'p4-u04': { bossId: 'boss4', fallbackLevel: 50 },
  'p4-u05': { bossId: 'boss5', fallbackLevel: 60 },
  'p4-u06': { bossId: 'boss6', fallbackLevel: 70 },
  'p4-u07': { bossId: 'boss7', fallbackLevel: 80 },
};

export function getQuestLocationUnlock(locationId) {
  return QUEST_LOCATION_UNLOCKS[String(locationId || '')] || null;
}

export function isQuestLocationUnlocked(profile, locationId) {
  const unlock = getQuestLocationUnlock(locationId);
  if (!unlock) return true;
  return Number(profile?.boss_kills_by_id?.[unlock.bossId] || 0) > 0 || Number(profile?.level || 1) >= unlock.fallbackLevel;
}
