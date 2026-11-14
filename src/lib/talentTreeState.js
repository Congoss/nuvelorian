export const TALENT_TREE_VERSION = 2;

const EARLY_THRESHOLDS = [30, 33, 36, 39, 42, 48, 54, 60, 66, 72, 82, 92, 102, 112, 122, 132, 142, 152, 162, 172, 192, 212, 232, 252, 272, 292, 312, 332, 352, 372, 407, 442, 477, 512, 547, 582, 617, 652, 687, 722, 757, 792, 827, 862, 897, 932, 967, 1002, 1037, 1072];

export function getTalentThreshold(index = 0) {
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  return EARLY_THRESHOLDS[safeIndex] || EARLY_THRESHOLDS[EARLY_THRESHOLDS.length - 1] + (safeIndex - EARLY_THRESHOLDS.length + 1) * 60;
}

export function migrateTalentTreeState(player) {
  if (Number(player.talent_tree_version || 0) >= TALENT_TREE_VERSION) return player;
  const legacyPoints = Math.max(0, Number(player.talent_points || 0));
  const legacyProgress = Math.max(0, Number(player.boss_talent_progress || 0));
  return {
    ...player,
    talent_tree_version: TALENT_TREE_VERSION,
    legacy_talent_levels: { ...(player.talent_levels || {}) },
    talent_levels: {},
    available_talent_points: legacyPoints,
    total_talent_points_earned: legacyPoints,
    total_talent_points_spent: 0,
    talent_damage_progress: legacyProgress,
    next_talent_threshold_index: Math.max(0, Number(player.boss_talent_level || 1) - 1),
    unlocked_talent_sectors: [1],
    talent_combat_state: {},
    talent_base_max_energy: Math.max(1, Number(player.max_energy || 100)),
  };
}

export function awardTalentDamage(player, damage) {
  const next = { ...migrateTalentTreeState(player) };
  next.talent_damage_progress = Math.max(0, Number(next.talent_damage_progress || 0) + Math.max(0, Number(damage || 0)));
  while (next.talent_damage_progress >= getTalentThreshold(next.next_talent_threshold_index)) {
    next.talent_damage_progress -= getTalentThreshold(next.next_talent_threshold_index);
    next.next_talent_threshold_index = Number(next.next_talent_threshold_index || 0) + 1;
    next.available_talent_points = Number(next.available_talent_points || 0) + 1;
    next.total_talent_points_earned = Number(next.total_talent_points_earned || 0) + 1;
  }
  next.talent_points = next.available_talent_points;
  next.boss_talent_progress = next.talent_damage_progress;
  next.boss_talent_level = next.next_talent_threshold_index + 1;
  next.boss_talent_progress_goal = getTalentThreshold(next.next_talent_threshold_index);
  return next;
}
