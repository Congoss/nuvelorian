export const PVP_RANK_THRESHOLDS = [0, 72, 144, 240, 360, 504, 672, 864, 1032, 1200];
export const PVP_SERIES_SIZE = 5;
export const PVP_SEARCH_SECONDS = 10;
export const PVP_FULL_REFILL_STARS = 99;
export function pvpRefillQuote(attempts) {
  const missing = Math.max(0, PVP_SERIES_SIZE - Math.max(0, Math.min(PVP_SERIES_SIZE, Math.floor(Number(attempts) || 0))));
  return { attempts: missing, stars: Math.ceil(PVP_FULL_REFILL_STARS * missing / PVP_SERIES_SIZE) };
}
export const PVP_COOLDOWN_MS = 8 * 60_000;
export function getPvpRefillProduct(itemId) {
  const match = String(itemId || '').match(/^pvp_refill_([1-5])$/);
  if (!match) return null;
  const attempts = Number(match[1]), stars = Math.ceil(PVP_FULL_REFILL_STARS * attempts / PVP_SERIES_SIZE);
  return { id: itemId, title: `PvP +${attempts}`, pvpRefillAttempts: attempts, stars, usd: stars / 100, paymentMethods: ['telegram_stars'] };
}
export const PVP_MIN_RATING_CHANGE = 20;
export const PVP_MAX_RATING_CHANGE = 25;
