import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) process.env[key] = '';

const txHash = 'HtCjcaMNZ5496nM3zTuQmMBVsh6QHJm3GFGbyn937Z35';
const yocto = '1333969465789210013186213';
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options = {}) => {
  if (String(url).includes('/v3/accounts/nuvelorian.near/txns')) {
    return { ok: true, json: async () => ({ data: [{
      transaction_hash: txHash,
      signer_account_id: 'psyho_logy.tg',
      receiver_account_id: 'nuvelorian.near',
      actions: [{ action: 'TRANSFER' }],
      actions_agg: { deposit: yocto },
      outcomes: { status: true },
      block_timestamp: '1791713425052575407',
    }], meta: {} }) };
  }
  if (String(url).includes('rpc.mainnet.near.org')) {
    return { ok: true, json: async () => ({ result: {
      final_execution_status: 'FINAL',
      status: { SuccessValue: '' },
      transaction: { hash: txHash, signer_id: 'psyho_logy.tg', receiver_id: 'nuvelorian.near', actions: [{ Transfer: { deposit: yocto } }] },
    } }) };
  }
  throw new Error(`Unexpected fetch: ${url}`);
};

const [{ processPendingNearPayments }, { store }, { playerDb }, { paymentDb }] = await Promise.all([
  import('../app.js'),
  import('../data/store.js'),
  import('../data/player-db.js'),
  import('../data/payment-db.js'),
]);

test('server reconciles an incoming finalized NEAR pass transfer and unlocks the tier', async () => {
  const player = { id: 'near-pass-player', username: 'Player', created_by: 'telegram_test@miniapp.local', battle_pass: { seasonId: 'test-2026-09-14', xp: 0, tier: 'free', claims: [], items: [], tickets: 0 } };
  const [attachedPlayer] = playerDb.attachPlayers([player]);
  store.players = [attachedPlayer];

  const order = {
    id: 'near-pass-order', user_id: player.id, item_id: 'battle_pass_legendary', payment_method: 'near',
    status: 'pending', created_at: '2026-10-11T10:09:27.717Z', near_amount_locked: '1.333969465789210013186213',
    nearAmountYocto: yocto, tx_hash: null,
  };
  const oldMethods = {
    storeInit: store.init,
    playerDbInit: playerDb.init,
    flush: playerDb.flushDirtyPlayers,
    paymentInit: paymentDb.init,
    listPending: paymentDb.listPendingTransactions,
    findById: paymentDb.findTransactionById,
    findByHash: paymentDb.findTransactionByHash,
    claim: paymentDb.claimPendingTransaction,
    appendEvent: paymentDb.appendEvent,
  };
  let flushCount = 0;
  store.init = async () => {};
  playerDb.init = async () => {};
  playerDb.flushDirtyPlayers = async () => { flushCount += 1; };
  paymentDb.init = async () => true;
  paymentDb.listPendingTransactions = async () => order.status === 'pending' ? [order] : [];
  paymentDb.findTransactionById = async () => order;
  paymentDb.findTransactionByHash = async () => null;
  paymentDb.claimPendingTransaction = async (_id, patch) => {
    order.status = 'success';
    order.tx_hash = patch.tx_hash;
    order.amount_paid = patch.amount_paid;
    order.completed_at = patch.completed_at;
    return order;
  };
  paymentDb.appendEvent = async () => {};

  try {
    assert.equal(await processPendingNearPayments(), 1);
    assert.equal(order.status, 'success');
    assert.equal(order.tx_hash, txHash);
    assert.equal(attachedPlayer.battle_pass.tier, 'legendary');
    assert.equal(attachedPlayer.last_paid_purchase_item_id, 'battle_pass_legendary');
    assert.equal(flushCount, 1);
    assert.equal(await processPendingNearPayments(), 0);
  } finally {
    store.init = oldMethods.storeInit;
    playerDb.init = oldMethods.playerDbInit;
    playerDb.flushDirtyPlayers = oldMethods.flush;
    paymentDb.init = oldMethods.paymentInit;
    paymentDb.listPendingTransactions = oldMethods.listPending;
    paymentDb.findTransactionById = oldMethods.findById;
    paymentDb.findTransactionByHash = oldMethods.findByHash;
    paymentDb.claimPendingTransaction = oldMethods.claim;
    paymentDb.appendEvent = oldMethods.appendEvent;
    globalThis.fetch = originalFetch;
  }
});
