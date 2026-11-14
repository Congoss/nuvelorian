import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaymentService } from '../server/services/payment-service.js';
import { createTonPaymentService } from '../server/services/ton-payment.js';

test('locks payment amounts from usd price and exchange rates', () => {
  const service = createPaymentService({
    now: () => new Date('2026-06-15T00:00:00.000Z'),
    fetchRates: async () => ({ tonUsd: '2.50', nearUsd: '5.00', starsPerUsd: 100 }),
    catalog: {
      gemPacks: [
        { id: 'gems_100', usd: 0.99 },
      ],
      paymentMethods: [
        { id: 'ton' },
        { id: 'near' },
        { id: 'telegram_stars' },
      ],
    },
    db: {
      createTransaction() {
        throw new Error('not expected');
      },
    },
  });

  const amounts = service.buildLockedAmounts({ usdPrice: 0.99, rates: { tonUsd: '2.50', nearUsd: '5.00', starsPerUsd: 100 } });

  assert.equal(amounts.usdPrice, '0.99');
  assert.equal(amounts.tonAmountLocked, '0.396000000');
  assert.equal(amounts.nearAmountLocked, '0.198000000000000000000000');
  assert.equal(amounts.nearAmountYocto, '198000000000000000000000');
  assert.equal(amounts.starsAmountLocked, 99);
});

test('uses a fixed Telegram Stars amount for a catalog item', () => {
  const service = createPaymentService();
  const amounts = service.buildLockedAmounts({
    usdPrice: 2.99,
    rates: { tonUsd: '2.50', nearUsd: '5.00', starsPerUsd: 100 },
    starsAmount: 299,
  });
  assert.equal(amounts.starsAmountLocked, 299);
});

test('fixed Stars orders are independent of crypto quotes', async () => {
  const service = createPaymentService({
    catalog: { gemPacks: [{ id: 'fixed-stars', usd: 2.99, stars: 299 }] },
    fetchRates: async () => { throw new Error('quote service unavailable'); },
    db: { createTransaction: async order => order },
  });
  const order = await service.purchase({ itemId: 'fixed-stars', userId: 'p', paymentMethod: 'telegram_stars' });
  assert.equal(order.starsAmountLocked, 299);
});

test('processes the same successful transaction only once', async () => {
  let rewardCalls = 0;
  const transactions = new Map();
  const service = createPaymentService({
    now: () => new Date('2026-06-15T00:00:00.000Z'),
    fetchRates: async () => ({ tonUsd: '2.50', nearUsd: '5.00', starsPerUsd: 100 }),
    catalog: {
      gemPacks: [{ id: 'gems_100', usd: 0.99 }],
      paymentMethods: [{ id: 'ton' }],
    },
    db: {
      async createTransaction(transaction) {
        transactions.set(transaction.id, transaction);
        return transaction;
      },
      async findTransactionById(id) {
        return transactions.get(id) || null;
      },
      async findTransactionByHash() {
        return null;
      },
      async updateTransaction(id, patch) {
        const current = transactions.get(id);
        const next = { ...current, ...patch };
        transactions.set(id, next);
        return next;
      },
      async appendEvent() {},
    },
    grantReward: async () => {
      rewardCalls += 1;
    },
    tonReceiver: 'UQB9cLJrCItp1lg_ebAvAQ3Ui5AHn_ouzXaqe9BYblVzguMv',
  });

  const order = await service.purchase({ itemId: 'gems_100', userId: 'u1', paymentMethod: 'ton' });
  const first = await service.confirmTonPayment({
    orderId: order.id,
    txHash: 'tx-1',
    amount: order.tonAmountLocked,
    recipient: 'UQB9cLJrCItp1lg_ebAvAQ3Ui5AHn_ouzXaqe9BYblVzguMv',
    confirmed: true,
  });
  const second = await service.confirmTonPayment({
    orderId: order.id,
    txHash: 'tx-1',
    amount: order.tonAmountLocked,
    recipient: 'UQB9cLJrCItp1lg_ebAvAQ3Ui5AHn_ouzXaqe9BYblVzguMv',
    confirmed: true,
  });

  assert.equal(first.status, 'success');
  assert.equal(second.status, 'success');
  assert.equal(rewardCalls, 1);
});

test('TON verification requires the exact order comment and nanoTON amount', async () => {
  const ton = createTonPaymentService({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        transactions: [{
          hash: 'tx-1',
          in_msg: {
            source: { address: 'sender' },
            value: '123',
            message_content: { decoded: { comment: 'order:order-1:gems_100' } },
          },
        }],
      }),
    }),
  });

  const verified = await ton.verifyTonTransaction({
    order: { id: 'order-1' },
    receiver: 'receiver',
    expectedNanoAmount: '123',
    orderComment: 'order:order-1:gems_100',
  });
  const rejected = await ton.verifyTonTransaction({
    order: { id: 'order-2' },
    receiver: 'receiver',
    expectedNanoAmount: '123',
    orderComment: 'order:order-2:gems_100',
  });

  assert.equal(verified.confirmed, true);
  assert.equal(rejected.confirmed, false);
});
