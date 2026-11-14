import { calculateEnergy, calculatePendingIncome } from '../../src/lib/gameConfig.js';
import { normalizePlayerProgression } from './progression.js';

export function hydratePlayerState(player) {
  const normalized = normalizePlayerProgression(player);
  const pendingIncome = calculatePendingIncome(normalized.last_income_collect, normalized.tentacles_per_hour);
  const currentEnergy = calculateEnergy(
    normalized.last_energy_update,
    normalized.energy,
    normalized.max_energy,
    normalized.energy_regen_rate
  );

  return {
    ...normalized,
    tentacles: (normalized.tentacles || 0) + pendingIncome,
    energy: currentEnergy,
  };
}

export function buildPlayerStateSnapshot(player) {
  const normalized = normalizePlayerProgression(player);
  const pendingIncome = calculatePendingIncome(normalized.last_income_collect, normalized.tentacles_per_hour);
  const currentEnergy = calculateEnergy(
    normalized.last_energy_update,
    normalized.energy,
    normalized.max_energy,
    normalized.energy_regen_rate,
  );

  return {
    ...normalized,
    tentacles: (normalized.tentacles || 0) + pendingIncome,
    energy: currentEnergy,
  };
}
