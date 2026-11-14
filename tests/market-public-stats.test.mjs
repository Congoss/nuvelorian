import test from 'node:test';
import assert from 'node:assert/strict';
import { marketPublicStats } from '../server/services/market-public-stats.js';

const tx = n => String(n).repeat(44).slice(0, 44).replace(/0/g, '1');
const lot = (id, extra) => ({ id, status: 'active', sellerId: 'p1', sellerAi: false, price: 1000, item: { id: 'item-' + id }, ...extra });

test('an empty or missing book gives zeros, not errors', () => {
  for (const book of [undefined, {}, { lots: [], orders: [], agents: [] }]) {
    const s = marketPublicStats(book);
    assert.deepEqual([s.trades, s.sellers, s.buyers, s.volumeHundredths, s.activeLots, s.recent.length], [0, 0, 0, 0, 0, 0]);
  }
});

test('only chain-verified sales count; kinds, people, volume and fees add up', () => {
  const book = {
    agents: [{ id: 'agent-tor' }, { id: 'agent-grym' }],
    orders: [{ id: 'o3', agentKey: 'grym' }],
    lots: [
      lot('a'),                                                                                          // listed by a player
      lot('b', { sellerAi: true, sellerId: 'agent-tor' }),                                               // listed by Tor
      lot('c', { status: 'cancelled' }),
      lot('d', { status: 'reserved', orderId: 'o9' }),                                                   // payment not confirmed yet
      lot('e', { status: 'sold' }),                                                                      // no tx hash: never counted
      lot('1', { status: 'sold', txHash: tx(2), buyerId: 'p2', price: 2000, fee: 100, soldAt: '2026-11-13T10:00:00Z' }),
      lot('2', { status: 'sold', txHash: tx(3), sellerAi: true, sellerId: 'agent-tor', buyerId: 'p2', price: 5000, fee: 250, soldAt: '2026-11-13T12:00:00Z' }),
      lot('3', { status: 'sold', txHash: tx(4), sellerId: 'p3', buyerId: 'agent-grym', orderId: 'o3', price: 3000, fee: 150, soldAt: '2026-11-13T11:00:00Z' }),
    ],
  };
  const s = marketPublicStats(book);
  assert.deepEqual([s.trades, s.playerTrades, s.merchantSales, s.merchantPurchases], [3, 1, 1, 1]);
  assert.deepEqual([s.sellers, s.buyers], [2, 1]); // sellers p1, p3; buyer p2 (merchants are not people)
  assert.deepEqual([s.volumeHundredths, s.feeHundredths], [10000, 500]);
  assert.deepEqual([s.activeLots, s.merchantLots], [2, 1]);
  assert.deepEqual(s.recent.map(r => r.kind), ['merchant-sale', 'merchant-buy', 'player']); // newest first
  assert.equal(s.recent[0].priceHundredths, 5000);
  assert.equal(marketPublicStats(book, { recentLimit: 1 }).recent.length, 1);
});

test('nothing private leaves the summary', () => {
  const book = { agents: [], orders: [], lots: [lot('1', { status: 'sold', txHash: tx(5), seller: 'SecretNick', sellerWallet: 'private-seller.near', buyerId: 'buyer-77', soldAt: '2026-11-13T10:00:00Z', item: { id: 'x', agentCost: 99 } })] };
  const text = JSON.stringify(marketPublicStats(book));
  for (const secret of ['SecretNick', 'private-seller.near', 'buyer-77', 'p1', 'agentCost']) assert.equal(text.includes(secret), false, secret);
});
