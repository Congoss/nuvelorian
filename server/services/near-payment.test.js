import test from 'node:test';
import assert from 'node:assert/strict';
import { createNearPaymentService } from './near-payment.js';

const hash = '1'.repeat(44);
const payment = { txHash: hash, senderAccountId: 'player.near', receiverAccountId: 'shop.near', expectedYoctoAmount: '123456789012345678901234' };
const good = { final_execution_status: 'FINAL', status: { SuccessValue: '' }, transaction: { hash, signer_id: 'player.near', receiver_id: 'shop.near', actions: [{ Transfer: { deposit: payment.expectedYoctoAmount } }] } };

test('incoming transfer scan preserves yocto precision and paginates finalized indexer rows', async () => {
  const expected = '1333969465789210013186213';
  const requests = [];
  const service = createNearPaymentService({ fetchImpl: async (url, options) => {
    requests.push({ url: String(url), options });
    if (String(url).includes('rpc.mainnet.near.org')) return { ok: true, json: async () => ({ result: {
      final_execution_status: 'FINAL', status: { SuccessValue: '' },
      transaction: { hash, signer_id: 'player.near', receiver_id: 'shop.near', actions: [{ Transfer: { deposit: expected } }] },
    } }) };
    const page = String(url).includes('next=cursor-2');
    return { ok: true, json: async () => page ? { data: [], meta: {} } : { data: [
      { transaction_hash: hash, signer_account_id: 'player.near', receiver_account_id: 'shop.near', block_timestamp: '1791713425052575407', actions: [{ action: 'TRANSFER' }], actions_agg: { deposit: expected }, outcomes: { status: true } },
      { transaction_hash: '2'.repeat(44), signer_account_id: 'player.near', receiver_account_id: 'shop.near', block_timestamp: '1791713425052575407', actions: [{ action: 'TRANSFER' }], actions_agg: { deposit: 1.333 }, outcomes: { status: true } },
    ], meta: { next_page: 'cursor-2' } } };
  } });

  const transfers = await service.listRecentIncomingTransfers({ receiverAccountId: 'shop.near', oldestTimestampNs: '1791713425000000000' });
  assert.deepEqual(transfers.map(({ txHash, amountYocto }) => ({ txHash, amountYocto })), [{ txHash: hash, amountYocto: expected }]);
  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /^https:\/\/api\.nearblocks\.io\/v3\/accounts\/shop\.near\/txns\?/);
  assert.doesNotMatch(requests[0].url, /[?&]receiver=/);
  assert.equal(requests[0].options.headers.Authorization, undefined);
  assert.match(requests[1].url, /next=cursor-2/);
  assert.equal((await service.verifyNearTransaction({ ...payment, expectedYoctoAmount: expected })).confirmed, true);
});

test('NEAR uses official JSON-RPC tx with finality and exact integer amounts', async () => {
  const service = createNearPaymentService({ fetchImpl: async (url, options) => {
    assert.equal(url, 'https://rpc.mainnet.near.org');
    const body = JSON.parse(options.body);
    assert.equal(body.jsonrpc, '2.0');
    assert.equal(body.method, 'tx');
    assert.deepEqual(body.params, { tx_hash: hash, sender_account_id: 'player.near', wait_until: 'FINAL' });
    return { ok: true, json: async () => ({ result: good }) };
  } });
  assert.equal((await service.verifyNearTransaction(payment)).confirmed, true);
});

test('wrong hash, signer, receiver, amount, failure or nonfinal transfer cannot grant rewards', async () => {
  const variants = [
    { ...good, final_execution_status: 'EXECUTED_OPTIMISTIC' },
    { ...good, status: { Failure: {} } },
    { ...good, transaction: { ...good.transaction, hash: '2'.repeat(44) } },
    { ...good, transaction: { ...good.transaction, signer_id: 'other.near' } },
    { ...good, transaction: { ...good.transaction, receiver_id: 'other.near' } },
    { ...good, transaction: { ...good.transaction, actions: [{ Transfer: { deposit: '1' } }] } },
  ];
  for (const result of variants) {
    const service = createNearPaymentService({ fetchImpl: async () => ({ ok: true, json: async () => ({ result }) }) });
    assert.equal((await service.verifyNearTransaction(payment)).confirmed, false);
  }
});

test('RPC errors and malformed payment data do not confirm', async () => {
  const service = createNearPaymentService({ fetchImpl: async () => ({ ok: true, json: async () => ({ error: { message: 'Unknown transaction' } }) }) });
  await assert.rejects(() => service.verifyNearTransaction(payment), /Unknown transaction/);
  await assert.rejects(() => service.verifyNearTransaction({ ...payment, txHash: '' }), /Invalid NEAR/);
});
