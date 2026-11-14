import test from 'node:test';
import assert from 'node:assert/strict';
import { POISON_SHOP, poisonShopState, purchaseEventPoison } from '../src/lib/eventPoisonShop.js';
const now = Date.parse(POISON_SHOP.startAt) + 1000;
const createPlayer = id => ({ id, tentacles: 1000000000 });
test('48 hour window is fixed and rejects purchases at expiry', () => {
  assert.equal(Date.parse(POISON_SHOP.endAt) - Date.parse(POISON_SHOP.startAt), 48 * 3600000);
  const player = createPlayer('a');
  assert.throws(() => purchaseEventPoison([player], player, { productId: 'large', quantity: 5, requestId: 'expiry-0001' }, Date.parse(POISON_SHOP.endAt)), /закрито/);
});
test('purchase debits tentacles, grants poison, and persists global stock through serialization', () => {
  const player = createPlayer('a');
  const body = { productId: 'large', quantity: 5, requestId: 'purchase-001' };
  purchaseEventPoison([player], player, body, now);
  assert.equal(player.tentacles, 999000000);
  assert.equal(player.weapon_inventory['large-poison'], 5);
  purchaseEventPoison([player], player, body, now);
  assert.equal(player.weapon_inventory['large-poison'], 5);
  assert.equal(poisonShopState(JSON.parse(JSON.stringify([player])), now).products[0].remaining, 294);
  assert.throws(() => purchaseEventPoison([player], player, { ...body, quantity: 6 }, now), /використаний/);
});
test('shared stock cannot oversell and invalid purchases leave balance unchanged', async () => {
  const players = [createPlayer('a'), createPlayer('b')];
  purchaseEventPoison(players, players[0], { productId: 'large', quantity: 298, requestId: 'reserve-001' }, now);
  const results = await Promise.allSettled(players.map((player, index) => Promise.resolve().then(() => purchaseEventPoison(players, player, { productId: 'large', quantity: 1, requestId: `last-unit-${index}` }, now))));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(poisonShopState(players, now).products[0].remaining, 0);
  const balance = players[1].tentacles;
  for (const quantity of [0, -1, 1.5, '5', 1000]) assert.throws(() => purchaseEventPoison(players, players[1], { productId: 'small', quantity, requestId: 'invalid-001' }, now));
  assert.equal(players[1].tentacles, balance);
  players[1].tentacles = 0;
  assert.throws(() => purchaseEventPoison(players, players[1], { productId: 'small', quantity: 1, requestId: 'no-funds-001' }, now), /щупалець/);
});
