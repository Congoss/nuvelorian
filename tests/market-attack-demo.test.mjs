import test from 'node:test';
import assert from 'node:assert/strict';
import { runAttackDemo } from '../server/services/market-attack-demo.js';
import { usdToHundredths, FALLBACK_PL4_USD } from '../src/lib/marketPricing.js';

test('every attack on the merchants is blocked and the honest trade still works', async () => {
  const report = await runAttackDemo();
  const failed = report.results.filter(r => !r.ok).map(r => `${r.id}: ${r.detail}`);
  assert.deepEqual(failed, []);
  assert.equal(report.passed, true);
  assert.equal(report.attacks, 10);
  assert.equal(report.blocked, 10);
  const by = Object.fromEntries(report.results.map(r => [r.id, r]));
  // the control proves the rules are not simply "never buy"
  assert.deepEqual([by['honest-restock'].result, by['honest-restock'].merchantBuys], ['works', 1]);
  // attacks that must cost the merchants nothing at all
  for (const id of ['supply-flood', 'sell-back-loop', 'fresh-accounts', 'overpriced']) assert.deepEqual([by[id].merchantBuys, by[id].merchantPaid], [0, 0], id);
  // attacks that can win exactly the one allowed purchase
  for (const id of ['repeat-seller', 'linked-accounts']) assert.equal(by[id].merchantBuys, 1, id);
  assert.ok(by['flood-one-ticket'].merchantBuys <= 1);
  // total spend in the many-sellers case stays inside the shared daily cap of $2
  assert.ok(by['daily-budget'].merchantPaid <= usdToHundredths(2, FALLBACK_PL4_USD));
  assert.equal(report.network, false);
  assert.equal(report.llm, false);
});

test('the rehearsal restores the environment and is repeatable', async () => {
  process.env.MARKET_AGENTS_DAILY_USD = '999';
  try {
    const first = await runAttackDemo(), second = await runAttackDemo();
    assert.equal(process.env.MARKET_AGENTS_DAILY_USD, '999');
    assert.deepEqual(first.results.map(r => [r.id, r.ok, r.merchantBuys, r.merchantPaid]), second.results.map(r => [r.id, r.ok, r.merchantBuys, r.merchantPaid]));
  } finally { delete process.env.MARKET_AGENTS_DAILY_USD; }
});
