import { getCARankBackfillNotice } from './caRankBackfillNotice.js';
import {gameDebugLog} from './gameDebugLog.js';
import { auditXp, trackPlayer } from './playerAudit.js';
import { reconcilePlayerAchievements } from './playerAchievements.js';
import { captureDailyTaskProgress } from '../../src/lib/questNotifications.js';
import { getXpForLevel, getBaseEnergyRegenRate } from '../../src/lib/gameConfig.js';
import { getGlobalWeekMeta } from './globalWeeklyCycle.js';
import { battlePassView } from './battlePass.js';
import { ensurePassiveTimer } from './passiveRewards.js';
import { calculateEquipmentEffects } from '../../src/lib/equipmentEffects.js';
import { getTalentEnergyBonus, getPlayerLevelEnergyBonus } from '../../src/lib/talents.js';

function getHeroTier(level) {
  if (level >= 20) return 'legend';
  if (level >= 10) return 'raider';
  if (level >= 5) return 'survivor';
  return 'scavenger';
}

export function normalizePlayerProgression(player) {
  reconcilePlayerAchievements(player);
  captureDailyTaskProgress(player, getGlobalWeekMeta());
  ensurePassiveTimer(player);
  const currentBattlePassView = battlePassView(player);
  const equipmentEffects = calculateEquipmentEffects(player).effects;
  const equipmentEnergyCapacity = equipmentEffects.energyCapacityFlat;
  const energyRegenBase = getBaseEnergyRegenRate(player);
  // Retry journals contain previous response bodies. Keep them in authoritative
  // storage, outside every client profile and redundant bootstrap projection.
  const { scrap, safe_scrap, scrap_per_hour, coins, x_oauth,
    combat_receipts, combat_retired_requests, combat_request_floor, forge_receipts,
    ...currentFields } = player;
  const weekMeta = getGlobalWeekMeta();
  let level = Math.max(1, Math.floor(Number(player.level) || 1));
  let xp = Math.max(0, Number(player.xp) || 0);
  let xpToNextLevel = getXpForLevel(level);
  let safety = 0;
  while (xp >= xpToNextLevel && safety < 10000) {
    xp -= xpToNextLevel;
    level += 1;
    xpToNextLevel = getXpForLevel(level);
    safety += 1;
  }
  return {
    ...currentFields,
    ca_rank_backfill_notice: getCARankBackfillNotice(player),
    max_energy: Math.max(1, Number(player.talent_base_max_energy) ||
      (Number(player.max_energy || 100) - getTalentEnergyBonus(player) - Number(player.equipment_energy_capacity || 0)))
      + getPlayerLevelEnergyBonus(level) + getTalentEnergyBonus(player) + equipmentEnergyCapacity,
    equipment_energy_capacity: equipmentEnergyCapacity,
    energy_regen_base_rate: energyRegenBase,
    energy_regen_rate: energyRegenBase * (1 + equipmentEffects.energyRegenPct),
    equipment_energy_regen_pct: equipmentEffects.energyRegenPct,
    tentacles: Number(player.tentacles ?? scrap ?? coins ?? 0) || 0,
    safe_tentacles: Number(player.safe_tentacles ?? safe_scrap ?? 0) || 0,
    tentacles_per_hour: Number(player.tentacles_per_hour ?? scrap_per_hour ?? 10) || 0,
    battle_pass_view: currentBattlePassView,
    language: player.language || 'en',
    level,
    xp,
    // Always derive the next threshold from the current level. Never freeze
    // progression because an old/stale stored threshold reached zero.
    xp_to_next_level: xpToNextLevel,
    hero_tier: getHeroTier(level),
    currentDayIndex: weekMeta.currentDayIndex,
    currentDateKey: weekMeta.currentDateKey,
    previousDateKey: weekMeta.previousDateKey,
    currentWeekKey: weekMeta.currentWeekKey,
  };
}

export function migrateLegacyResourceFields(player) {
  if (!player || typeof player !== 'object') return false;
  let changed = false;
  const visit = (value) => {
    if (!value || typeof value !== 'object') return value === 'scrap' ? 'tentacles' : value;
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        const next = visit(value[index]);
        if (next !== value[index]) { value[index] = next; changed = true; }
      }
      return value;
    }
    for (const [key, entry] of Object.entries(value)) {
      const canonicalKey = key === 'scrap' ? 'tentacles'
        : key === 'safe_scrap' ? 'safe_tentacles'
          : key === 'scrap_per_hour' ? 'tentacles_per_hour' : key;
      const next = visit(entry);
      if (canonicalKey !== key) {
        if (value[canonicalKey] === undefined) value[canonicalKey] = next;
        delete value[key];
        changed = true;
      } else if (next !== entry) {
        value[key] = next;
        changed = true;
      }
    }
    return value;
  };
  visit(player);
  for (const [currentKey, legacyKey] of [
    ['tentacles', 'scrap'],
    ['safe_tentacles', 'safe_scrap'],
    ['tentacles_per_hour', 'scrap_per_hour'],
  ]) {
    if (player[currentKey] === undefined && player[legacyKey] !== undefined) {
      player[currentKey] = player[legacyKey];
      changed = true;
    }
    if (legacyKey in player) {
      delete player[legacyKey];
      changed = true;
    }
  }
  if (player.tentacles === undefined && player.coins !== undefined) {
    player.tentacles = Number(player.coins) || 0;
    changed = true;
  }
  return changed;
}

export function grantXpToPlayer(player, amount) {
  trackPlayer(player);
  auditXp(player,amount);
  const normalized = normalizePlayerProgression(player);
  let xp = (normalized.xp || 0) + Math.max(0, amount || 0);
  let level = normalized.level || 1;
  let xpToNextLevel = getXpForLevel(level);

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level += 1;
    xpToNextLevel = getXpForLevel(level);
  }

  normalized.xp = xp;
  normalized.level = level;
  normalized.xp_to_next_level = xpToNextLevel;
  normalized.hero_tier = getHeroTier(level);

  Object.assign(player, {
    xp: normalized.xp,
    level: normalized.level,
    xp_to_next_level: normalized.xp_to_next_level,
    hero_tier: normalized.hero_tier,
  });

  gameDebugLog('[xp] updated', {
    playerId: player?.id || null,
    gain: Math.max(0, amount || 0),
    xp: normalized.xp,
    level: normalized.level,
    xpToNextLevel: normalized.xp_to_next_level,
  });

  return {
    xp: normalized.xp,
    level: normalized.level,
    xp_to_next_level: normalized.xp_to_next_level,
    hero_tier: normalized.hero_tier,
  };
}
