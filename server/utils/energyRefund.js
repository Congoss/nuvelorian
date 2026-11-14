export function refundCombatEnergy(player, amount) {
  const current = Math.max(0, Number(player.energy) || 0);
  const cap = Math.max(1, Number(player.max_energy) || 100);
  player.energy = Math.max(current, Math.min(cap, current + Math.max(0, Number(amount) || 0)));
}

// T48: one roll per confirmed attack, including a batch with any critical hit.
export function refundCriticalEnergy(player, isCrit, levels, random = Math.random) {
  const chance = Math.min(1, Math.max(0, Number(levels?.t48) || 0) * .02);
  if (!isCrit || !chance || random() >= chance) return false;
  refundCombatEnergy(player, 10);
  return true;
}
