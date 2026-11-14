import test from 'node:test';
import assert from 'node:assert/strict';
import { selectGiftAudience } from '../server/utils/giftAudience.js';
import { decimalUnits, replayHold, buildNearAudience } from '../server/utils/nearAudience.js';

test('audience filters use AND and exclude banned players', () => {
  const players = [{ id: 'a', level: 12, near_wallet_verified: true, near_wallet_id: 'alice.near', battle_pass: { tier: 'epic' } }, { id: 'b', level: 1 }, { id: 'c', level: 20, is_banned: true }];
  assert.deepEqual(selectGiftAudience(players, { minLevel: 10, maxLevel: 15, battlePass: 'paid', walletRequired: true }).map(p => p.id), ['a']);
  assert.equal(selectGiftAudience(players, { battlePass: 'legendary' }).length, 0);
  assert.throws(() => selectGiftAudience(players, { minLevel: 20, maxLevel: 10 }));
});
test('token precision stays exact and hold rejects buys after cutoff and balance dips', () => {
  assert.equal(decimalUnits('123456789012345.12', 24), 123456789012345120000000000000000000000n);
  const event = (time, delta) => ({ block_timestamp: String(time), delta_amount: String(delta), affected_account_id: 'alice.near', contract_account_id: 'token.near' });
  assert.equal(replayHold(100n, 50n, [event(80, 10), event(30, 90)], 'alice.near', 'token.near', 50n, 100n), true);
  assert.equal(replayHold(100n, 50n, [event(80, 100)], 'alice.near', 'token.near', 50n, 100n), false);
  assert.equal(replayHold(100n, 50n, [event(90, 80), event(80, -80)], 'alice.near', 'token.near', 50n, 100n), false);
  assert.throws(() => decimalUnits('1.234', 2));
});
test('current token and NFT checks, shared wallet deduplication, failures excluded', async () => {
  let balances = 0;
  const fetchImpl = async (_url, options) => {
    const call = JSON.parse(options.body);
    if (call.method === 'block') return Response.json({ result: { header: { hash: 'snapshot', height: 100, timestamp_nanosec: '1791382516000000000' } } });
    let value;
    const args = JSON.parse(Buffer.from(call.params.args_base64, 'base64'));
    if (call.params.method_name === 'ft_metadata') value = { decimals: 2 };
    else if (args.account_id === 'bad.near') return Response.json({ error: { message: 'Unavailable' } });
    else if (call.params.method_name === 'ft_balance_of') { balances += 1; value = '200'; }
    else value = '2';
    assert.equal(call.params.block_id, 'snapshot');
    return Response.json({ result: { result: [...Buffer.from(JSON.stringify(value))] } });
  };
  const players = [{ id: '1', near_wallet_verified: true, near_wallet_id: 'alice.near' }, { id: '2', near_wallet_verified: true, near_wallet_id: 'alice.near' }, { id: '3', near_wallet_verified: true, near_wallet_id: 'bad.near' }];
  const result = await buildNearAudience(players, { tokenContract: 'token.near', minTokenBalance: '1.50', nftContract: 'nft.near', minNftCount: '2' }, { fetchImpl });
  assert.equal(result.recipients.length, 2);
  assert.equal(result.unknown.length, 1);
  assert.equal(balances, 1);
});

test('NEAR audience retries rate-limited RPC requests', async () => {
  let requests = 0;
  const fetchImpl = async (_url, options) => {
    requests += 1;
    if (requests === 1) return new Response('', { status: 429, headers: { 'Retry-After': '0.001' } });
    const call = JSON.parse(options.body);
    if (call.method === 'block') return Response.json({ result: { header: { hash: 'snapshot', height: 100, timestamp_nanosec: '1791382516000000000' } } });
    const args = JSON.parse(Buffer.from(call.params.args_base64, 'base64'));
    const value = call.params.method_name === 'ft_metadata' ? { decimals: 2 } : args.account_id === 'alice.near' ? '200' : '0';
    return Response.json({ result: { result: [...Buffer.from(JSON.stringify(value))] } });
  };
  const result = await buildNearAudience([{ id: '1', near_wallet_verified: true, near_wallet_id: 'alice.near' }], { tokenContract: 'token.near', minTokenBalance: '1.50' }, { fetchImpl });
  assert.equal(result.recipients.length, 1);
  assert.equal(result.unknown.length, 0);
  assert.equal(requests, 4);
});
