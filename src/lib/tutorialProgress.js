export function isNewbieTutorialActive(profile) {
  return Boolean(profile?.id && !profile.tutorial_disabled && !profile.tutorial_level_eight_reward_claimed);
}

export function getQuestTutorialRecoveryStep({ questRowCount, hasLocationPicker }) {
  if (hasLocationPicker && questRowCount < 7) return 'task-location';
  if (!hasLocationPicker && questRowCount > 0) return 'quest-sector';
  return null;
}

const FIRST_QUEST_TUTORIAL_TASKS = [
  ['scout', 3, 4], ['loot', 4, 5], ['repair', 4, 5], ['trade', 5, 6],
  ['fight', 6, 6], ['cache', 7, 7], ['final', 8, 8],
];

export const FIRST_QUEST_TUTORIAL_ENERGY = FIRST_QUEST_TUTORIAL_TASKS.reduce((sum, [, energy, target]) => sum + energy * target, 0);

export function canSpendTutorialEnergyOnMission(profile, missionId) {
  const step = profile?.tutorial_step;
  if (!['welcome', 'quests', 'task-location', 'quest-sector'].includes(step)) return true;
  if (step !== 'quest-sector') return false;
  const expectedMission = FIRST_QUEST_TUTORIAL_TASKS.find(([slug, , target]) => (
    Math.floor(Number(profile?.task_completions?.[`p4-u00-${slug}`] || 0) / target) < 1
  ));
  return Boolean(expectedMission && missionId === `p4-u00-${expectedMission[0]}`);
}

export const TUTORIAL_STEPS = new Set([
  'welcome', 'quests', 'task-location', 'quest-sector', 'artifacts', 'claim-reward',
  'home', 'daily', 'daily-claim', 'daily-tab', 'newbie-list', 'newbie-claim',
  'newbie-close', 'roulette', 'roulette-spin', 'roulette-wait', 'done', 'bosses',
  'boss-select', 'boss-finger', 'boss-pencil', 'boss-poison', 'boss-finish',
  'boss-wait', 'boss-rewards', 'friends-wait-home', 'friends', 'journey',
  'skills-nav', 'skills-intro', 'level-eight', 'level-fifteen', 'completed',
  'context-done', 'energy-free',
]);

export function resolveTutorialStep(step, profile = null) {
  if (step === 'context-done') return Number(profile?.level || 1) >= 15 ? 'completed' : 'welcome';
  return TUTORIAL_STEPS.has(step) ? step : null;
}
