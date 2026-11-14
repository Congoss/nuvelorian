import { getCollectionDamageBonus } from '../../src/lib/gameConfig.js';
import { getClanAchievementState } from '../../src/lib/clanAchievements.js';
import { getCombatPoisonSlot } from '../../src/lib/combatPoison.js';
import { applyEquipmentBleed, resolveTalentBatch } from '../../src/lib/talentCombat.js';

export function clanPoisonMultiplier(clan) {
  if (!clan) return 1;
  const damage = getClanAchievementState('damage', clan.achievements?.damage);
  return 1 + Number(damage.benefit.poisonPct || 0) / 100;
}

export function applyBossEquipmentBleed(state, { weapon, levels, blocked, count, now, random = Math.random }) {
  const chance = Math.max(0, Math.min(1, Number(weapon.equipmentBleedChancePct || 0)));
  if (!blocked && weapon.id !== 'knuckle' && chance > 0 && random() < 1 - (1 - chance) ** count) {
    state = applyEquipmentBleed(state, {
      damage: 5 + Number(levels.t07 || 0) + Number(levels.t22 || 0),
      durationMs: 30000 * (1 + Number(levels.t23 || 0) * 0.03),
      now,
    });
  }
  return state.bleed ? { ...state, bleed: { ...state.bleed, critChance: Math.min(0.1, Number(levels.a14 || 0) * 0.01) } } : state;
}

export function resolveBossHit({ player, weapon, levels, state, fight, clan, count, now = Date.now(), random = Math.random }) {
  const batch = resolveTalentBatch({ player, weapon, levels, state, fight, now, count, random });
  const isPoison = Boolean(getCombatPoisonSlot(weapon.id));
  const multiplier = getCollectionDamageBonus(player) * (1 + Number(weapon.equipmentBossDamagePct || 0))
    * (isPoison ? clanPoisonMultiplier(clan) : 1);
  const damage = Math.max(0, Math.floor((batch.damage + batch.bleedDamage) * multiplier));
  return {
    ...batch,
    state: applyBossEquipmentBleed(batch.state, { weapon, levels, blocked: batch.blocked, count, now, random }),
    damage,
    poisonDamage: isPoison ? Math.min(damage, Math.floor(batch.damage * multiplier)) : 0,
  };
}
