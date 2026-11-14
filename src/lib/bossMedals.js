export const BOSS_MEDAL_THRESHOLDS = {
  bronze: 10,
  silver: 50,
  gold: 100,
};

export function getBossKillMap(entity) {
  return entity?.boss_kills_by_id || {};
}

export function getBossKillCount(entity, bossId) {
  return Math.max(0, Number(getBossKillMap(entity)?.[bossId] || 0));
}

export function getBossMedalTier(kills) {
  if (kills >= BOSS_MEDAL_THRESHOLDS.gold) return 'gold';
  if (kills >= BOSS_MEDAL_THRESHOLDS.silver) return 'silver';
  if (kills >= BOSS_MEDAL_THRESHOLDS.bronze) return 'bronze';
  return null;
}

export function getBossMedalProgress(kills, language = 'en') {
  const labels = language === 'ru' ? ['Бронзовая медаль','Серебряная медаль','Золотая медаль','Золотая медаль открыта'] : ['uk','ua'].includes(language) ? ['Бронзова медаль','Срібна медаль','Золота медаль','Золоту медаль відкрито'] : ['Bronze medal','Silver medal','Gold medal','Gold medal unlocked'];
  if (kills >= BOSS_MEDAL_THRESHOLDS.gold) {
    return {
      current: BOSS_MEDAL_THRESHOLDS.gold,
      target: BOSS_MEDAL_THRESHOLDS.gold,
      label: labels[3],
    };
  }

  if (kills >= BOSS_MEDAL_THRESHOLDS.silver) {
    return {
      current: kills,
      target: BOSS_MEDAL_THRESHOLDS.gold,
      label: labels[2],
    };
  }

  if (kills >= BOSS_MEDAL_THRESHOLDS.bronze) {
    return {
      current: kills,
      target: BOSS_MEDAL_THRESHOLDS.silver,
      label: labels[1],
    };
  }

  return {
    current: kills,
    target: BOSS_MEDAL_THRESHOLDS.bronze,
    label: labels[0],
  };
}

export function getUnlockedBossMedals(kills) {
  return {
    bronze: kills >= BOSS_MEDAL_THRESHOLDS.bronze,
    silver: kills >= BOSS_MEDAL_THRESHOLDS.silver,
    gold: kills >= BOSS_MEDAL_THRESHOLDS.gold,
  };
}
