import { GAME_CONFIG } from './gameConfig.js';

export function isBossReleased(bossId) {
  const index = GAME_CONFIG.BOSSES.findIndex(boss => boss.id === bossId);
  return index >= 0 && (index < GAME_CONFIG.BOSSES.length - 3 || bossId === 'boss7' || bossId === 'boss8');
}
