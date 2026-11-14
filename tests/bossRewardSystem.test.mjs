import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateActualPoisonRefundUnits,
  calculateBossReward,
  DEFAULT_BOSS_REWARD_CONFIG,
  getBossDamageBoxIcon,
  getBossKeyDropChance,
  getBossParticipationThreshold,
  getBossRankMultiplier,
  sanitizeBossRewardConfig,
  stripRetiredBossFragments,
} from '../src/lib/bossRewardSystem.js';

const noSpecials = (config = DEFAULT_BOSS_REWARD_CONFIG) => ({
  ...config,
  specialDrop: { ...config.specialDrop, baseChance: { gear: 0, pet: 0, background: 0 } },
});

test('participation threshold adapts between small and large bosses', () => {
  assert.equal(getBossParticipationThreshold(1000), 100);
  assert.equal(getBossParticipationThreshold(2_000_000), 1000);
});

test('damage box icon follows configurable HP share thresholds', () => {
  assert.equal(getBossDamageBoxIcon(1, 1000), 'damage_box_1');
  assert.equal(getBossDamageBoxIcon(10, 1000), 'damage_box_2');
  assert.equal(getBossDamageBoxIcon(50, 1000), 'damage_box_3');
  assert.equal(getBossDamageBoxIcon(100, 1000), 'damage_box_4');
  assert.equal(getBossDamageBoxIcon(1000, 1000), 'damage_box_5');
});

test('ranking multiplier applies through top 100 only', () => {
  assert.equal(getBossRankMultiplier(1), 1.5);
  assert.equal(getBossRankMultiplier(25), 1.15);
  assert.equal(getBossRankMultiplier(101), 1);
});

test('whole next-boss key keeps the pity chance and caps at 100%', () => {
  assert.equal(getBossKeyDropChance(0), 0.1);
  assert.ok(Math.abs(getBossKeyDropChance(5) - 0.15) < 1e-9);
  assert.equal(getBossKeyDropChance(100), 0.5);
});

test('admin-configurable reward scale and added formula tiers are preserved', () => {
  const addedTier = { maxRank: 250, multiplier: 0.95 };
  const config = sanitizeBossRewardConfig({
    ...DEFAULT_BOSS_REWARD_CONFIG,
    rewardScale: 1,
    rankMultipliers: [...DEFAULT_BOSS_REWARD_CONFIG.rankMultipliers, addedTier],
  });
  assert.equal(getBossKeyDropChance(0, config), 0.2);
  assert.equal(config.rankMultipliers.at(-1).maxRank, 250);
  assert.equal(getBossRankMultiplier(250, config), 0.95);
});

test('boss-specific scene drop rate is used for that boss only', () => {
  const config = {
    ...DEFAULT_BOSS_REWARD_CONFIG,
    rewardScale: 1,
    specialDrop: {
      ...DEFAULT_BOSS_REWARD_CONFIG.specialDrop,
      baseChance: { gear: 0, pet: 0, background: 0.0045 },
      rankBonus: { rank1: 0, top10: 0, top100: 0 },
      maxChance: 1,
    },
    backgroundChanceByBoss: { ...DEFAULT_BOSS_REWARD_CONFIG.backgroundChanceByBoss, chinook: 0.025 },
  };
  const result = calculateBossReward({
    bossId: 'chinook', maxHp: 1000, actualDamageTotal: 1000, rank: 101,
    availableSpecials: ['background'], config, rng: () => 0,
  });
  assert.equal(result.specialChance, 0.025);
  assert.equal(result.drops.find((drop) => drop.type === 'boss_background').bossId, 'chinook');
});

test('poison refund is clipped to actual HP damage and paid doses', () => {
  assert.deepEqual(calculateActualPoisonRefundUnits({
    actualDamage: 100, poisonDamage: 800, plannedPoisonDamage: 800, consumedUses: 1,
  }), { actualPoisonDamage: 100, refundUnits: 0.125 });
  assert.deepEqual(calculateActualPoisonRefundUnits({
    actualDamage: 1000, poisonDamage: 1400, plannedPoisonDamage: 800, consumedUses: 1,
  }), { actualPoisonDamage: 1000, refundUnits: 1 });
});

test('fractional poison cashback is carried and converted without losing fractions', () => {
  const config = noSpecials({
    ...DEFAULT_BOSS_REWARD_CONFIG,
    cashbackTiers: DEFAULT_BOSS_REWARD_CONFIG.cashbackTiers.map((tier) => ({ ...tier, min: 0.2, max: 0.2 })),
  });
  let carries = { resources: {}, poison: {} };
  let totalRefunded = 0;
  for (let i = 0; i < 10; i += 1) {
    const result = calculateBossReward({
      maxHp: 1000, actualDamageTotal: 100, poisonRefundUnits: { medium: 0.5 },
      carries, availableSpecials: [], config, rng: () => 0,
    });
    carries = result.carries;
    totalRefunded += result.drops.filter((drop) => drop.type === 'weapon' && drop.id === 'f4').reduce((sum, drop) => sum + drop.qty, 0);
  }
  assert.equal(totalRefunded, 1);
  assert.equal(carries.poison.medium, 0);
});

test('a reward box can select at most one special item', () => {
  const config = {
    ...DEFAULT_BOSS_REWARD_CONFIG,
    specialDrop: { baseChance: { gear: 0.2, pet: 0.2, background: 0.2 }, rankBonus: { rank1: 0, top10: 0, top100: 0 }, maxChance: 0.9 },
  };
  const result = calculateBossReward({
    bossId: 'heli', maxHp: 1000, actualDamageTotal: 1000, rank: 1,
    config, rng: () => 0,
  });
  const specialDrops = result.drops.filter((drop) => ['boss_gear_piece', 'boss_pet', 'boss_background'].includes(drop.type));
  assert.equal(specialDrops.length, 1);
});

test('first-kill bonus and at most one whole pity key are in the same snapshot, with no fragments', () => {
  const result = calculateBossReward({
    bossId: 'heli', maxHp: 1000, actualDamageTotal: 50,
    firstKillDrops: [{ type: 'strength', qty: 25 }],
    pityDrops: [{ type: 'keycard', name: 'Boss Key', qty: 1, location: 'next-boss' }],
    availableSpecials: [], config: noSpecials(), rng: () => 0,
  });
  assert.equal(result.eligible, true);
  assert.equal(result.participationEligible, false);
  assert.deepEqual(result.drops.map((drop) => drop.type), ['strength', 'keycard']);
  assert.equal(result.drops.find((drop) => drop.type === 'keycard').qty, 1);
  assert.equal(result.drops.some((drop) => drop.keyFragment || drop.type.includes('fragment')), false);
});

test('legacy pending snapshots strip fragments but retain a whole key and special gear', () => {
  const drops = stripRetiredBossFragments([
    { type: 'keycard', keyFragment: true, qty: 4 },
    { type: 'gear_fragment', qty: 1 },
    { type: 'keycard', qty: 1, location: 'next-boss' },
    { type: 'equipment', itemId: 'set_weapon' },
  ]);
  assert.deepEqual(drops.map((drop) => drop.type), ['keycard', 'equipment']);
  assert.equal(drops[0].qty, 1);
});
