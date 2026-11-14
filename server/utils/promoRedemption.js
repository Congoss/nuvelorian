import { grantXpToPlayer } from './progression.js';
import { buildPromoUpdates, normalizePromoCode } from '../../src/lib/promoCodes.js';
export function redeemPromoCode(player, code, codes) {
 const normalized = normalizePromoCode(code);
 if ((player.used_promo_codes || []).some(value => normalizePromoCode(value) === normalized)) {
  throw Object.assign(new Error('Промокод уже використано на цьому акаунті'), {code:'PROMO_ALREADY_USED',statusCode:409});
 }
 const definition = codes.find(entry => normalizePromoCode(entry.code) === normalized);
 if (definition?.maxActivations > 0 && Number(definition.activationCount || 0) >= definition.maxActivations) throw Object.assign(new Error('Ліміт активацій промокоду вичерпано'),{code:'PROMO_LIMIT_REACHED',statusCode:409});
 const {promo,updates} = buildPromoUpdates(player,normalized,codes);
 if (!promo || !updates) throw Object.assign(new Error('Промокод не знайдено або він неактивний'), {code:'PROMO_NOT_FOUND',statusCode:400});
 const xpGain = Object.hasOwn(updates,'xp') ? updates.xp - Number(player.xp || 0) : 0;
 delete updates.xp;
 Object.assign(player,updates);
 if (xpGain > 0) grantXpToPlayer(player,xpGain);
 if (Object.hasOwn(updates,'energy')) player.last_energy_update = new Date().toISOString();
 definition.activationCount = Number(definition.activationCount || 0) + 1;
 return {promo:{code:normalized,label:promo.label,rewards:(promo.rewards || []).map(reward => ({...reward}))}};
}
