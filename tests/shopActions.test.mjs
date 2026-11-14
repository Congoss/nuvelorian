import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPlayerAction } from '../server/utils/playerActions.js';
import { dailyShopOffers } from '../src/lib/dailyShopOffers.js';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';

test('15k shop box purchase charges once, persists ownership and opens once', () => {
  const player = { tentacles: 20000, inventory_items: [], shop_daily_limits: {}, weapon_inventory: {}, energy: 10 };
  applyPlayerAction(player, { type: 'shop-fixed', itemId: 'daily_toxic_pack' });
  assert.equal(player.tentacles, 5000);
  assert.equal(player.inventory_items[0].count, 1);
  assert.throws(() => applyPlayerAction(player, { type: 'shop-fixed', itemId: 'popular_daily_toxic' }), { code: 'SHOP_DAILY_LIMIT' });
  const result = applyPlayerAction(player, { type: 'shop-open', itemId: 'daily_toxic_pack' });
  assert.equal(result.reward.drops.length, 3);
  assert.equal(player.inventory_items.length, 0);
  assert.equal(player.weapon_inventory['small-poison'], 4);
  assert.equal(player.weapon_inventory['medium-poison'], 1);
  assert.equal(player.energy, 60);
  assert.throws(() => applyPlayerAction(player, { type: 'shop-open', itemId: 'daily_toxic_pack' }), { code: 'SHOP_BOX_NOT_OWNED' });
});

test('failed purchase never charges or grants, and client prices cannot be overridden', () => {
  const player = { tentacles: 14999, inventory_items: [] };
  assert.throws(() => applyPlayerAction(player, { type: 'shop-fixed', itemId: 'daily_toxic_pack', cost: 0 }), { code: 'SHOP_INSUFFICIENT_FUNDS' });
  assert.equal(player.tentacles, 14999);
  assert.deepEqual(player.inventory_items, []);
});

test('boss damage pack has one server-enforced 79 T-Pape price', () => {
  const player = { premium: 250, inventory_items: [] };
  assert.throws(() => applyPlayerAction(player, { type: 'shop-fixed', itemId: 'popular_boss_damage' }), { code: 'SHOP_ITEM_INVALID' });
  applyPlayerAction(player, { type: 'shop-fixed', itemId: 'pack_boss_damage', cost: 1 });
  assert.equal(player.premium, 171);
  assert.equal(player.inventory_items[0].id, 'pack_boss_damage');
});

test('weekly progress pack uses the updated 299 T-Pape price', () => {
  const player = { premium: 349, inventory_items: [] };
  applyPlayerAction(player, { type: 'shop-fixed', itemId: 'pack_weekly_progress', cost: 1 });
  assert.equal(player.premium, 50);
  assert.equal(player.inventory_items[0].id, 'pack_weekly_progress');
});

test('each roulette spin pack can be bought up to five times per UTC day', () => {
  const player = { tentacles: 2_000_000, roulette_bonus_spins: 0, shop_daily_limits: {} };
  for (const [itemId, spins] of [['spin_1', 1], ['spin_5', 5], ['spin_20', 20]]) {
    for (let count = 0; count < 5; count += 1) applyPlayerAction(player, { type: 'shop-fixed', itemId });
    assert.throws(() => applyPlayerAction(player, { type: 'shop-fixed', itemId }), { code: 'SHOP_DAILY_LIMIT' });
    assert.equal(player.shop_daily_limits.counts[itemId], 5);
  }
  assert.equal(player.roulette_bonus_spins, 130);
});

test('daily offers charge the server price and grant only the selected reward', () => {
  const today = new Date().toISOString().slice(0, 10);
  const kills = Object.fromEntries(GAME_CONFIG.BOSSES.map((boss) => [boss.id, 1]));
  const player = { tentacles: 1000000, premium: 1000, energy: 10, boss_kills_by_id: kills, inventory_items: [], weapon_inventory: {}, keycards: {} };
  const offers = dailyShopOffers(player, today);
  assert.equal(offers.length, 3);
  for (const offer of offers) {
    const currency = offer.paymentCurrency === 'tentacles' ? 'tentacles' : 'premium';
    const cost = offer.kind === 'equipment' ? offer.premium : offer.cost[currency];
    const balance = player[currency];
    applyPlayerAction(player, { type: 'shop-daily', itemId: offer.id, cost: 0 });
    assert.equal(player[currency], balance - cost);
    assert.ok(player.daily_shop_purchases.includes(offer.id));
    assert.throws(() => applyPlayerAction(player, { type: 'shop-daily', itemId: offer.id }), { code: 'SHOP_DAILY_LIMIT' });
  }
  assert.throws(() => applyPlayerAction(player, { type: 'shop-daily', itemId: 'daily-forged' }), { code: 'SHOP_ITEM_INVALID' });
});

test('tentacles can no longer buy fixed energy offers; daily energy tentacle prices are updated', () => {
  const player = { tentacles: 100000, premium: 1000, energy: 0, max_energy: 100, shop_daily_limits: {} };
  for (const itemId of ['energy_25', 'energy_50', 'energy_100', 'popular_energy_25', 'energy_full']) {
    assert.throws(() => applyPlayerAction(player, { type: 'shop-energy', itemId }), { code: 'SHOP_ITEM_INVALID' });
  }
  const energyTentaclePrices = new Map([[25, 5000], [50, 10000], [100, 20000]]);
  for (let day = 1; day <= 31; day += 1) {
    const dateKey = `2026-10-${String(day).padStart(2, '0')}`;
    for (const offer of dailyShopOffers(player, dateKey)) {
      if (offer.kind === 'energy' && offer.paymentCurrency === 'tentacles') {
        assert.equal(offer.cost.tentacles, energyTentaclePrices.get(offer.qty));
      }
    }
  }
});
