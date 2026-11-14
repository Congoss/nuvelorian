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

export function getBossMedalProgress(kills) {
  if (kills >= BOSS_MEDAL_THRESHOLDS.gold) {
    return {
      current: BOSS_MEDAL_THRESHOLDS.gold,
      target: BOSS_MEDAL_THRESHOLDS.gold,
      label: 'Gold medal unlocked',
    };
  }

  if (kills >= BOSS_MEDAL_THRESHOLDS.silver) {
    return {
      current: kills,
      target: BOSS_MEDAL_THRESHOLDS.gold,
      label: 'Gold medal',
    };
  }

  if (kills >= BOSS_MEDAL_THRESHOLDS.bronze) {
    return {
      current: kills,
      target: BOSS_MEDAL_THRESHOLDS.silver,
      label: 'Silver medal',
    };
  }

  return {
    current: kills,
    target: BOSS_MEDAL_THRESHOLDS.bronze,
    label: 'Bronze medal',
  };
}

export function getUnlockedBossMedals(kills) {
  return {
    bronze: kills >= BOSS_MEDAL_THRESHOLDS.bronze,
    silver: kills >= BOSS_MEDAL_THRESHOLDS.silver,
    gold: kills >= BOSS_MEDAL_THRESHOLDS.gold,
  };
}
