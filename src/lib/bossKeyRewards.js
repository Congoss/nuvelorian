import { GAME_CONFIG, getLocalizedBossName } from './gameConfig.js';
export const BOSS_KEY_REWARDS=GAME_CONFIG.BOSSES.map(boss=>({field:`boss_key_${boss.id}`,bossId:boss.id,location:boss.keycardLocation}));
export function getBossKeyReward(field){return BOSS_KEY_REWARDS.find(reward=>reward.field===field)||null;}
export function getBossKeyRewardLabel(field,language='uk'){
 const reward=getBossKeyReward(field);if(!reward)return null;
 const boss=GAME_CONFIG.BOSSES.find(entry=>entry.id===reward.bossId);
 return `${language==='ru'?'Ключ':language==='en'?'Key':'Ключ'} · ${getLocalizedBossName(boss,language)}`;
}
