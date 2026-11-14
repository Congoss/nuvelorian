// Runs the compiled contract (res/p4_market_escrow.wasm) inside an in-memory NEAR mock.
//   node --test contracts/market-escrow/tests/
// No network, keys or Rust toolchain needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Chain} from './near-mock.mjs';

const WASM = fileURLToPath(new URL('../res/p4_market_escrow.wasm', import.meta.url));
const ESCROW = 'escrow.p4.test', TOKEN = 'pl4.test', OWNER = 'owner.test', GAME = 'game.test';
const TREASURY = 'treasury.test', BUYER = 'buyer.test', SELLER = 'seller.test';
const DAY = 86_400;

function setup(overrides = {}) {
  const chain = new Chain();
  const token = chain.addToken(TOKEN);
  chain.deploy(ESCROW, WASM);
  const init = chain.call(ESCROW, 'new', {
    owner: OWNER, operator: GAME, token: TOKEN, fee_recipient: TREASURY,
    fee_bps: 500, max_amount: '1000000', refund_after_sec: DAY, ...overrides,
  });
  for (const a of [ESCROW, TREASURY, BUYER, SELLER]) token.register(a);
  token.mint(BUYER, 5_000_000n);
  const pay = (tradeId, amount, {seller = SELLER, from = BUYER} = {}) =>
    chain.call(TOKEN, 'ft_transfer_call', {receiver_id: ESCROW, amount: String(amount), msg: JSON.stringify({trade_id: tradeId, seller})}, {from, deposit: 1n});
  const trade = id => chain.view(ESCROW, 'get_trade', {trade_id: id});
  const held = () => BigInt(chain.view(ESCROW, 'get_config').held);
  return {chain, token, init, pay, trade, held};
}

test('init stores the fixed rules and refuses unsafe ones', () => {
  const {chain, init} = setup();
  assert.equal(init.ok, true);
  assert.deepEqual(chain.view(ESCROW, 'get_config'), {
    owner: OWNER, operator: GAME, token: TOKEN, fee_recipient: TREASURY, fee_bps: 500,
    max_amount: '1000000', refund_after_sec: DAY, paused: false, held: '0', trade_count: 0,
  });
  assert.equal(chain.call(ESCROW, 'new', {owner: OWNER, operator: GAME, token: TOKEN, fee_recipient: TREASURY, fee_bps: 500, max_amount: '1', refund_after_sec: 1}).ok, false, 'second init');
  assert.equal(setup({fee_bps: 1001}).init.ok, false);
  assert.equal(setup({max_amount: '0'}).init.ok, false);
  assert.equal(setup({refund_after_sec: 0}).init.ok, false);
});

test('buyer payment is held by the contract and recorded on chain', () => {
  const {token, pay, trade, held} = setup();
  const r = pay('trade-1', 1000);
  assert.equal(r.ok, true);
  assert.equal(r.value, '1000', 'all tokens used');
  assert.equal(token.balanceOf(ESCROW), 1000n);
  assert.equal(held(), 1000n);
  const t = trade('trade-1');
  assert.deepEqual([t.buyer, t.seller, t.amount, t.fee, t.status], [BUYER, SELLER, '1000', '50', 'funded']);
  assert.ok(r.logs.some(l => l.startsWith('EVENT_JSON:') && l.includes('trade_funded')));
});

test('release pays the seller 95% and the treasury 5%, once', () => {
  const {chain, token, pay, trade, held} = setup();
  pay('trade-1', 1000);
  assert.equal(chain.call(ESCROW, 'release', {trade_id: 'trade-1'}, {from: SELLER}).ok, false, 'seller cannot release');
  assert.equal(chain.call(ESCROW, 'release', {trade_id: 'trade-1'}, {from: OWNER}).ok, false, 'owner cannot release');
  assert.equal(token.balanceOf(ESCROW), 1000n);

  assert.equal(chain.call(ESCROW, 'release', {trade_id: 'trade-1'}, {from: GAME}).ok, true);
  assert.deepEqual([token.balanceOf(SELLER), token.balanceOf(TREASURY), token.balanceOf(ESCROW)], [950n, 50n, 0n]);
  assert.equal(trade('trade-1').status, 'released');
  assert.equal(held(), 0n);

  assert.equal(chain.call(ESCROW, 'release', {trade_id: 'trade-1'}, {from: GAME}).ok, false, 'replay');
  assert.equal(chain.call(ESCROW, 'refund', {trade_id: 'trade-1'}, {from: GAME}).ok, false, 'refund after release');
  assert.deepEqual([token.balanceOf(SELLER), token.balanceOf(TREASURY)], [950n, 50n]);
});

test('rejected payments go straight back to the buyer', () => {
  const {chain, token, pay, held} = setup();
  const before = token.balanceOf(BUYER);
  pay('trade-1', 1000);
  const rejected = [
    pay('trade-1', 500),                       // duplicate id
    pay('big', 1_000_001),                     // above the per-trade cap
    pay('bad id!', 10),                        // invalid id
    pay('self', 10, {seller: BUYER}),          // buyer == seller
    chain.call(TOKEN, 'ft_transfer_call', {receiver_id: ESCROW, amount: '10', msg: 'not json'}, {from: BUYER, deposit: 1n}),
  ];
  for (const r of rejected) assert.equal(r.value, '0', 'nothing kept');
  assert.equal(token.balanceOf(BUYER), before - 1000n);
  assert.equal(token.balanceOf(ESCROW), 1000n);
  assert.equal(held(), 1000n);
  // only the configured token contract may report a payment
  const fake = chain.call(ESCROW, 'ft_on_transfer', {sender_id: BUYER, amount: '999', msg: JSON.stringify({trade_id: 'fake', seller: SELLER})}, {from: 'fake-token.test'});
  assert.equal(fake.ok, false);
  assert.equal(chain.view(ESCROW, 'get_trade', {trade_id: 'fake'}), null);
});

test('buyer can take the tokens back alone after the timeout, the operator at any time', () => {
  const {chain, token, pay, trade, held} = setup();
  const start = token.balanceOf(BUYER);
  pay('trade-1', 1000);
  assert.equal(chain.call(ESCROW, 'refund', {trade_id: 'trade-1'}, {from: BUYER}).ok, false, 'too early');
  assert.equal(chain.call(ESCROW, 'refund', {trade_id: 'trade-1'}, {from: SELLER}).ok, false, 'not the seller');
  chain.advance(DAY - 1);
  assert.equal(chain.call(ESCROW, 'refund', {trade_id: 'trade-1'}, {from: BUYER}).ok, false, 'one second early');
  chain.advance(1);
  assert.equal(chain.call(ESCROW, 'refund', {trade_id: 'trade-1'}, {from: BUYER}).ok, true);
  assert.equal(token.balanceOf(BUYER), start);
  assert.equal(trade('trade-1').status, 'refunded');
  assert.equal(chain.call(ESCROW, 'release', {trade_id: 'trade-1'}, {from: GAME}).ok, false, 'release after refund');
  assert.equal(chain.call(ESCROW, 'refund', {trade_id: 'trade-1'}, {from: BUYER}).ok, false, 'second refund');

  pay('trade-2', 400);
  assert.equal(chain.call(ESCROW, 'refund', {trade_id: 'trade-2'}, {from: GAME}).ok, true, 'operator, no wait');
  assert.equal(token.balanceOf(BUYER), start);
  assert.equal(held(), 0n);
  assert.equal(token.balanceOf(ESCROW), 0n);
});

test('a failed transfer is retried alone and never pays twice', () => {
  const {chain, token, pay, trade, held} = setup();
  pay('trade-1', 1000, {seller: 'newbie.test'}); // seller has no storage on the token yet
  assert.equal(chain.call(ESCROW, 'release', {trade_id: 'trade-1'}, {from: GAME}).ok, true);
  let t = trade('trade-1');
  assert.deepEqual([t.status, t.seller_leg, t.fee_leg], ['funded', 'Unpaid', 'Paid']);
  assert.deepEqual([token.balanceOf(TREASURY), token.balanceOf(ESCROW), held()], [50n, 950n, 950n]);
  assert.equal(chain.call(ESCROW, 'refund', {trade_id: 'trade-1'}, {from: GAME}).ok, false, 'fee already left');

  token.register('newbie.test');
  assert.equal(chain.call(ESCROW, 'release', {trade_id: 'trade-1'}, {from: GAME}).ok, true);
  t = trade('trade-1');
  assert.equal(t.status, 'released');
  assert.deepEqual([token.balanceOf('newbie.test'), token.balanceOf(TREASURY), token.balanceOf(ESCROW), held()], [950n, 50n, 0n, 0n]);
});

test('callbacks and owner functions are closed to outsiders', () => {
  const {chain, token, pay, trade} = setup();
  pay('trade-1', 1000);
  for (const from of [BUYER, SELLER, GAME, OWNER]) {
    assert.equal(chain.call(ESCROW, 'on_payout', {trade_id: 'trade-1', fee_leg: false, amount: '950'}, {from, promiseResults: [{ok: true}]}).ok, false);
    assert.equal(chain.call(ESCROW, 'on_refund', {trade_id: 'trade-1'}, {from, promiseResults: [{ok: true}]}).ok, false);
  }
  assert.equal(trade('trade-1').status, 'funded');
  assert.equal(chain.call(ESCROW, 'set_paused', {paused: true}, {from: GAME, deposit: 1n}).ok, false, 'not owner');
  assert.equal(chain.call(ESCROW, 'set_paused', {paused: true}, {from: OWNER}).ok, false, 'needs 1 yocto');
  assert.equal(chain.call(ESCROW, 'set_operator', {operator: BUYER}, {from: BUYER, deposit: 1n}).ok, false);

  assert.equal(chain.call(ESCROW, 'set_paused', {paused: true}, {from: OWNER, deposit: 1n}).ok, true);
  assert.equal(pay('trade-2', 10).value, '0', 'paused: payment returned');
  // pause never traps funds that are already inside
  assert.equal(chain.call(ESCROW, 'release', {trade_id: 'trade-1'}, {from: GAME}).ok, true);
  assert.equal(token.balanceOf(SELLER), 950n);

  assert.equal(chain.call(ESCROW, 'set_operator', {operator: 'game2.test'}, {from: OWNER, deposit: 1n}).ok, true);
  assert.equal(chain.view(ESCROW, 'get_config').operator, 'game2.test');
});

test('many trades: the contract never holds less than it owes and no token is created or lost', () => {
  const {chain, token, pay, held} = setup();
  const supply = token.total();
  let seed = 42;
  const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
  const ids = [];
  for (let i = 0; i < 300; i++) {
    const action = rnd(5);
    if (action <= 1 || ids.length === 0) {
      const id = 't' + i;
      if (pay(id, 1 + rnd(9000)).value !== '0') ids.push(id);
    } else {
      const id = ids[rnd(ids.length)];
      const from = [GAME, BUYER, SELLER, 'x.test'][rnd(4)];
      chain.call(ESCROW, action === 2 ? 'release' : 'refund', {trade_id: id}, {from});
      if (rnd(4) === 0) chain.advance(DAY);
    }
    assert.equal(token.balanceOf(ESCROW), held(), 'balance equals what is owed, step ' + i);
    assert.equal(token.total(), supply);
  }
  assert.ok(token.balanceOf(TREASURY) > 0n && token.balanceOf(SELLER) > 0n);
  // the treasury received exactly the fee of every released trade
  let fees = 0n, sellers = 0n;
  for (const id of ids) {
    const t = chain.view(ESCROW, 'get_trade', {trade_id: id});
    if (t.status === 'released') { fees += BigInt(t.fee); sellers += BigInt(t.amount) - BigInt(t.fee); }
  }
  assert.equal(token.balanceOf(TREASURY), fees);
  assert.equal(token.balanceOf(SELLER), sellers);
});
