// Display-only prediction. Never mutate the authoritative fight or inventory.
export function pendingBossHp(fight, pending) {
  const hp = Math.max(0, Number(fight?.current_hp) || 0);
  if (!hp || !pending || pending.fightId !== fight?.id || fight?.status !== 'active') return hp;
  const damage = Number(pending.damage);
  return Number.isFinite(damage) && damage > 0 ? Math.max(1, hp - damage) : hp;
}

export function pendingBossStock(stock, weaponId, pending) {
  if (stock === null || !pending || pending.weaponId !== weaponId) return stock;
  return Math.max(0, stock - pending.count);
}
