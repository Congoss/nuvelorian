import { EQUIPMENT_SET_BALANCE } from './equipmentBalance.js';

export const SHKRABAN_RELEASE_READY = true;
export const SHKRABAN_BALANCE = EQUIPMENT_SET_BALANCE.shkraban;
export const SHKRABAN_ENABLED = SHKRABAN_RELEASE_READY || Boolean(import.meta.env?.DEV)
  || (typeof process !== 'undefined' && (process.env.NODE_ENV === 'development' || process.env.SHKRABAN_STAGING === 'true'));
export const SHKRABAN_ROOT = '/shkraban';
export const SHKRABAN_BOSS_ID = 'boss8';
export const SHKRABAN_PET_ID = 'pet-toaster';
export const SHKRABAN_BACKGROUND_ID = 'boss-8-fight';
export const SHKRABAN_SLOTS = ['weapon', 'head', 'armor', 'hands', 'legs', 'boots'];
export const SHKRABAN_ITEM_IDS = SHKRABAN_SLOTS.map(slot => `shkraban_${slot}`);
export const SHKRABAN_MEDALS = Object.fromEntries(['bronze', 'silver', 'gold'].map(tier => [tier, `${SHKRABAN_ROOT}/medal-${tier}.svg`]));
export const SHKRABAN_BOSS_AVATAR = `${SHKRABAN_ROOT}/boss-avatar.webp`;
export const SHKRABAN_HERO_AVATAR = `${SHKRABAN_ROOT}/hero-avatar.webp`;
export function ownsShkrabanHead(player) {
  return player?.equipped_items?.head === 'shkraban_head' || (player?.inventory_items || []).some(item => item.id === 'shkraban_head');
}
export function shkrabanReleaseBlockers() {
  return [...(!SHKRABAN_RELEASE_READY ? ['Production activation is not authorized.'] : []), ...(!SHKRABAN_BALANCE ? ['Equipment and pet balance awaits user specification.'] : [])];
}
