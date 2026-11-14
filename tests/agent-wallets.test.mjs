import assert from 'node:assert/strict';
import test from 'node:test';
import {agentWalletConfig,checkAgentWallet} from '../server/services/agent-wallets.js';

const enc = v => [...Buffer.from(JSON.stringify(v))];
function fakeRpc({accounts}) {
  return async (_url, init) => {
    const {params} = JSON.parse(init.body);
    if (params.request_type === 'view_account') {
      const acc = accounts[params.account_id];
      return {json: async () => acc ? {result:{amount:acc.yocto}} : {error:{cause:{name:'UNKNOWN_ACCOUNT'}}}};
    }
    const args = JSON.parse(Buffer.from(params.args_base64,'base64'));
    const acc = accounts[args.account_id] || {};
    if (params.method_name === 'storage_balance_of') return {json: async () => ({result:{result:enc(acc.registered ? {total:'1250000000000000000000',available:'0'} : null)}})};
    if (params.method_name === 'ft_balance_of') return {json: async () => ({result:{result:enc(acc.pl4 || '0')}})};
    throw new Error('unexpected');
  };
}
const accounts = {
  'tor.owner.tg': {yocto:'200000000000000000000000', registered:true, pl4:'650000000000000000000000'},
  'grym.owner.tg': {yocto:'10000000000000000000000', registered:false},
};

test('reads accounts from env only for configured agents', () => {
  assert.deepEqual(agentWalletConfig({MARKET_AGENT_SMITH_NEAR:' Tor.Owner.tg ', MARKET_AGENT_HUNTER_NEAR:''}), [{key:'smith', account:'tor.owner.tg'}]);
});
test('a funded, registered account is OK with balances', async () => {
  const r = await checkAgentWallet('tor.owner.tg', {fetchImpl:fakeRpc({accounts})});
  assert.equal(r.ok, true); assert.ok(Math.abs(r.near - 0.2) < 1e-9); assert.equal(r.registered, true); assert.equal(Math.round(r.pl4), 650000);
});
test('missing PL4 registration and low NEAR are reported', async () => {
  const r = await checkAgentWallet('grym.owner.tg', {fetchImpl:fakeRpc({accounts})});
  assert.equal(r.ok, false); assert.equal(r.exists, true);
  assert.ok(r.issues.some(i=>i.includes('storage_deposit'))); assert.ok(r.issues.some(i=>i.includes('0.05 NEAR')));
});
test('unknown and invalid accounts fail without throwing', async () => {
  assert.equal((await checkAgentWallet('nobody.owner.tg', {fetchImpl:fakeRpc({accounts})})).exists, false);
  assert.equal((await checkAgentWallet('Bad Account', {fetchImpl:fakeRpc({accounts})})).error, 'invalid account id');
  assert.match((await checkAgentWallet('tor.owner.tg', {fetchImpl:async()=>{throw new Error('offline');}})).error, /offline/);
});
