export const FRIDAY13_END_AT = '2026-11-16T10:00:00.000Z';
export const FRIDAY13_FRAME_IDS = Object.freeze([
  'friday13_player_1', 'friday13_player_2', 'friday13_player_3',
  'friday13_guild_1', 'friday13_guild_2', 'friday13_guild_3',
]);

export function isFriday13SaleActive(now = Date.now()) {
  return now < Date.parse(FRIDAY13_END_AT);
}

export function friday13SalePrice(amount, now = Date.now()) {
  const value = Number(amount || 0);
  return isFriday13SaleActive(now) ? Math.max(1, Math.ceil(value / 2)) : value;
}

export function applyFriday13SaleToProduct(item, now = Date.now()) {
  if (!item || !isFriday13SaleActive(now) || item.constructionUnits || item.pvpRefillAttempts || item.friday13SalePercent === 50) return item;
  const next = { ...item, friday13SalePercent: 50 };
  if (Number.isFinite(Number(item.usd)) && Number(item.usd) > 0) next.usd = Math.max(0.01, Math.round(Number(item.usd) * 50) / 100);
  if (Number.isFinite(Number(item.stars)) && Number(item.stars) > 0) next.stars = Math.max(1, Math.ceil(Number(item.stars) / 2));
  if (Number.isFinite(Number(item.near)) && Number(item.near) > 0) next.near = Number((Number(item.near) / 2).toFixed(6));
  return next;
}

export function getFriday13PlayerReward(rank) {
  if (rank === 1) return { smallPoison: 300, mediumPoison: 250, largePoison: 200, gums: { normal: 10, improved: 8, premium: 5 }, spins: 100, cardPlays: 30 };
  if (rank === 2) return { smallPoison: 250, mediumPoison: 200, largePoison: 150, gums: { normal: 8, improved: 6, premium: 3 }, spins: 75, cardPlays: 25 };
  if (rank === 3) return { smallPoison: 200, mediumPoison: 150, largePoison: 100, gums: { normal: 6, improved: 4, premium: 2 }, spins: 50, cardPlays: 20 };
  if (rank <= 10) return { smallPoison: 150, mediumPoison: 100, largePoison: 75, gums: { normal: 4, improved: 2, premium: 1 }, spins: 35, cardPlays: 15 };
  if (rank <= 50) return { smallPoison: 100, mediumPoison: 75, largePoison: 50, gums: { normal: 2, improved: 1, premium: 0 }, spins: 20, cardPlays: 10 };
  return { smallPoison: 50, mediumPoison: 30, largePoison: 20, gums: { normal: 1, improved: 0, premium: 0 }, spins: 10, cardPlays: 5 };
}

export function getFriday13GuildShipReward(rank) {
  return rank === 1 ? 100_000_000 : rank === 2 ? 75_000_000 : rank === 3 ? 50_000_000 : 10_000_000;
}
