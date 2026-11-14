import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDailyShopPatch } from '../server/utils/daily-shop-limits.js';

const today = '2026-10-05';

test('daily offers can be appended once, while replay and reset are rejected', () => {
  const first = validateDailyShopPatch({}, {
    daily_shop_date: today,
    daily_shop_purchases: [`daily-${today}-1`],
  }, today);
  assert.deepEqual(first.patch.daily_shop_purchases, [`daily-${today}-1`]);

  const repeated = validateDailyShopPatch({ daily_shop_date: today, daily_shop_purchases: first.patch.daily_shop_purchases }, {
    daily_shop_date: today,
    daily_shop_purchases: [`daily-${today}-1`],
  }, today);
  assert.match(repeated.error, /must be new/);

  const reset = validateDailyShopPatch({ daily_shop_date: today, daily_shop_purchases: first.patch.daily_shop_purchases }, {
    daily_shop_date: today,
    daily_shop_purchases: [],
  }, today);
  assert.match(reset.error, /reset/);
});

test('daily offers become available on the next UTC day', () => {
  const nextDay = '2026-10-06';
  const result = validateDailyShopPatch({ daily_shop_date: today, daily_shop_purchases: [`daily-${today}-0`] }, {
    daily_shop_date: nextDay,
    daily_shop_purchases: [`daily-${nextDay}-0`],
  }, nextDay);
  assert.deepEqual(result.patch.daily_shop_purchases, [`daily-${nextDay}-0`]);
});

test('daily-limited shop counters are monotonic and respect item caps', () => {
  const first = validateDailyShopPatch({}, { shop_daily_limits: { day: today, counts: { energy_25: 1 } } }, today);
  assert.equal(first.patch.shop_daily_limits.counts.energy_25, 1);

  const repeated = validateDailyShopPatch({ shop_daily_limits: first.patch.shop_daily_limits }, {
    shop_daily_limits: { day: today, counts: { energy_25: 1 } },
  }, today);
  assert.match(repeated.error, /increment exactly one/);

  const capped = validateDailyShopPatch({ shop_daily_limits: { day: today, counts: { energy_50: 1 } } }, {
    shop_daily_limits: { day: today, counts: { energy_50: 2 } },
  }, today);
  assert.match(capped.error, /reset or exceeded/);
});

test('roulette purchase counters allow five purchases of each spin size', () => {
  const counts = { spin_1: 4, spin_5: 4, spin_20: 4 };
  const result = validateDailyShopPatch({ shop_daily_limits: { day: today, counts } }, {
    shop_daily_limits: { day: today, counts: { spin_1: 5, spin_5: 4, spin_20: 4 } },
  }, today);
  assert.equal(result.patch.shop_daily_limits.counts.spin_1, 5);
  const exceeded = validateDailyShopPatch({ shop_daily_limits: result.patch.shop_daily_limits }, {
    shop_daily_limits: { day: today, counts: { spin_1: 6, spin_5: 4, spin_20: 4 } },
  }, today);
  assert.match(exceeded.error, /reset or exceeded/);
});
