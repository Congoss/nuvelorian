import { GAME_CONFIG, getLocalizedBossName } from './gameConfig.js';
import { getBossKillCount, getBossMedalTier, getBossMedalProgress } from './bossMedals.js';
import { getShipBossName } from './shipBattleText.js';
export function getPlayerMedalCollection(profile, language = 'uk') {
  const standard = GAME_CONFIG.BOSSES.map(boss => ({ id: boss.id, name: getLocalizedBossName(boss, language), kills: getBossKillCount(profile, boss.id), ship: false }));
  const shipIds = new Set(['hull', 'engine', 'hangar', 'portal', ...Object.keys(profile?.ship_boss_kills || {})]);
  const ship = [...shipIds].map(id => ({ id: 'ship-' + id, moduleId: id, name: getShipBossName(id, language), kills: Math.max(0, Number(profile?.ship_boss_kills?.[id]) || 0), ship: true }));
  return [...standard, ...ship].map(row => ({ ...row, tier: getBossMedalTier(row.kills), progress: getBossMedalProgress(row.kills, language) }));
}
