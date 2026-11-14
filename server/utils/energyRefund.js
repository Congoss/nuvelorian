export function refundCombatEnergy(player, amount) {
  const current = Math.max(0, Number(player.energy) || 0);
  const cap = Math.max(1, Number(player.max_energy) || 100);
  player.energy = Math.max(current, Math.min(cap, current + Math.max(0, Number(amount) || 0)));
}
