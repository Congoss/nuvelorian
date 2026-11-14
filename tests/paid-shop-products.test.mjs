import test from 'node:test';
import assert from 'node:assert/strict';
import { getPaidPoisonPack, getShopCatalog, getShopPaymentProduct } from '../src/lib/shopCatalog.js';
import { createPaymentService } from '../server/services/payment-service.js';

test('roulette accepts Stars and NEAR with server-priced batch quantities', async () => {
  const payment = createPaymentService({
    fetchRates: async () => ({ nearUsd: '5.00', starsPerUsd: 100 }),
    catalog: getShopCatalog(),
    db: { async createTransaction(order) { return order; } },
  });
  for (const count of [1, 5, 10, 100]) {
    const product = getShopPaymentProduct(`roulette_spin_${count}`, getShopCatalog());
    assert.deepEqual(product.paymentMethods, ['telegram_stars', 'near']);
    for (const paymentMethod of product.paymentMethods) {
      const order = await payment.purchase({ itemId: product.id, userId: 'roulette-player', paymentMethod });
      assert.equal(order.usd_price, (count * 0.1).toFixed(2));
      assert.equal(order.payment_method, paymentMethod);
      if (paymentMethod === 'telegram_stars') assert.equal(order.stars_amount_locked, count * 10);
      else assert.ok(BigInt(order.nearAmountYocto) > 0n);
    }
  }
});

test('paid consumables use the agreed Stars prices and current-rate NEAR USD pricing', () => {
  const catalog = getShopCatalog();
  assert.deepEqual(catalog.paidConsumablePacks.map(({ id, stars, usd }) => ({ id, stars, usd })), [
    { id: 'paid_poison_small', stars: 9, usd: 0.09 },
    { id: 'paid_poison_medium', stars: 19, usd: 0.19 },
    { id: 'paid_poison_large', stars: 39, usd: 0.39 },
  ]);
  assert.equal(getShopPaymentProduct('paid_energy_100', catalog).stars, 49);
  assert.equal(getShopPaymentProduct('paid_energy_100', catalog).usd, 0.49);
  assert.equal(getShopPaymentProduct('paid_energy_1000', catalog).stars, 490);
  assert.equal(getShopPaymentProduct('paid_energy_1002', catalog), null);
  assert.equal(getPaidPoisonPack('large-poison', 100).stars, 3900);
  assert.equal(getPaidPoisonPack('large-poison', 100).amount, 100);
  assert.equal(getShopPaymentProduct('paid_poison_medium_25', catalog).usd, 4.75);
  assert.equal(getShopPaymentProduct('paid_poison_small_101', catalog), null);
});

test('paid poison orders lock selected item count and price on the server', async () => {
  const transactions = [];
  const payment = createPaymentService({
    fetchRates: async () => ({ nearUsd: '5.00', starsPerUsd: 100 }),
    catalog: getShopCatalog(),
    db: { async createTransaction(order) { transactions.push(order); return order; } },
  });

  const order = await payment.purchase({ itemId: 'paid_poison_large_100', userId: 'player-1', paymentMethod: 'telegram_stars' });
  assert.equal(order.usd_price, '39.00');
  assert.equal(order.stars_amount_locked, 3900);
  assert.equal(transactions[0].item_id, 'paid_poison_large_100');
  await assert.rejects(
    payment.purchase({ itemId: 'paid_poison_large_101', userId: 'player-1', paymentMethod: 'telegram_stars' }),
    { code: 'SHOP_ITEM_NOT_FOUND' },
  );
});

test('paid energy payment orders lock the selected quantity and price against the server catalog', async () => {
  const transactions = [];
  const payment = createPaymentService({
    fetchRates: async () => ({ nearUsd: '5.00', starsPerUsd: 100 }),
    catalog: getShopCatalog(),
    db: { async createTransaction(order) { transactions.push(order); return order; } },
  });

  const order = await payment.purchase({ itemId: 'paid_energy_100', userId: 'player-1', paymentMethod: 'telegram_stars' });
  assert.equal(order.usd_price, '0.49');
  assert.equal(order.stars_amount_locked, 49);
  assert.equal(transactions[0].item_id, 'paid_energy_100');

  await assert.rejects(
    payment.purchase({ itemId: 'paid_energy_1002', userId: 'player-1', paymentMethod: 'telegram_stars' }),
    { code: 'SHOP_ITEM_NOT_FOUND' },
  );
});
