import { SHIP_MODULES } from './clanShipPreview.js';
import { BOSS_MEDAL_THRESHOLDS, getBossKillCount } from './bossMedals.js';

export const DOSSIER_BOSS_ID = 'heli';
export const DOSSIER_BOSS_IDS = ['heli', 'tank', 'chinook', 'boss4', 'boss5', 'boss6', 'boss7', 'boss8', 'ship-hull', 'ship-engine', 'ship-hangar', 'ship-portal'];
export const DOSSIER_REWARD_MULTIPLIERS = {heli:1,tank:1.5,chinook:2,boss4:2.5,boss5:3,boss6:4,boss7:4.5,boss8:5,'ship-hull':5,'ship-engine':5,'ship-hangar':5,'ship-portal':5};
const BASE_REWARDS = [
  {'small-poison':10,'medium-poison':5,'large-poison':2,spins:5},
  {'small-poison':25,'medium-poison':15,'large-poison':5,spins:15},
  {'small-poison':50,'medium-poison':30,'large-poison':15,spins:30},
];
const SHIP_GUM_REWARDS = [[1,0], [2,1], [3,2]];
function dossierRewards(bossId, index) {
  const rewards = Object.fromEntries(Object.entries(BASE_REWARDS[index]).map(([key, amount]) =>
    [key, Math.ceil(amount * DOSSIER_REWARD_MULTIPLIERS[bossId])]));
  const module = SHIP_MODULES.find(entry => 'ship-' + entry.id === bossId);
  if (!module) return rewards;

  // Ship HP is two million per module level.
  const scale = Math.sqrt(module.level);
  for (const key of ['small-poison', 'medium-poison', 'large-poison']) {
    rewards[key] = 5 * Math.round(rewards[key] * scale / 5);
  }
  const [normal, improved] = SHIP_GUM_REWARDS[index];
  rewards['gum-normal'] = Math.ceil(normal * scale);
  if (improved) rewards['gum-improved'] = Math.ceil(improved * scale);
  return rewards;
}
export function getDossierChapters(bossId = DOSSIER_BOSS_ID) {
  if (!DOSSIER_BOSS_IDS.includes(bossId)) return [];
  return ['bronze', 'silver', 'gold'].map((tier, index) => ({
    bossId, tier, id: `dossier_${bossId}_${tier}`, target: BOSS_MEDAL_THRESHOLDS[tier],
    rewards: dossierRewards(bossId, index),
  }));
}
export const DOSSIER_CHAPTERS = getDossierChapters();
export const ALL_DOSSIER_CHAPTERS = DOSSIER_BOSS_IDS.flatMap(getDossierChapters);
export function dossierChapterUnlocked(profile, chapter) {
  if (chapter.bossId?.startsWith('ship-')) return Math.max(0, Number(profile?.ship_boss_kills?.[chapter.bossId.slice(5)]) || 0) >= chapter.target;
  return getBossKillCount(profile, chapter.bossId || DOSSIER_BOSS_ID) >= chapter.target;
}
export function dossierRewardReady(profile, bossId = DOSSIER_BOSS_ID) {
  return getDossierChapters(bossId).some(chapter => dossierChapterUnlocked(profile, chapter) && profile?.player_achievements?.[chapter.id]?.reward_status !== 'claimed');
}

export { DOSSIER_STORIES } from './bossDossierStories.js';
