import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { KeyPair } from '@near-js/crypto';
import { serializeNep413 } from '@near-wallet-selector/core';

process.env.NODE_ENV = 'test';
process.env.NEAR_NETWORK = 'mainnet';
process.env.NEAR_WALLET_RPC_URL = 'https://proof-rpc.test/';
const [{createApp},{store},{playerDb},{paymentDb}] = await Promise.all([
  import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js'),import('../server/data/payment-db.js'),
]);
store.init = playerDb.init = paymentDb.init = async () => {};
store.persistSoon = () => {};
store.persistNow = async () => {};
playerDb.flushDirtyPlayers = async () => {};
store.players = playerDb.attachPlayers([{id:'proof-owner',telegram_id:'123',level:1},{id:'other-player',telegram_id:'456',level:1}]);

test('wallet proof verifies the correct RPC, retries one signature and rejects invalid ownership', async () => {
  const server = createApp();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const originalFetch = global.fetch;
  let mode = 'offline';
  let rpcCalls = 0;
  let rpcGate;
  let notifyRpc;
  const key = KeyPair.fromRandom('ed25519');
  const publicKey = key.getPublicKey().toString();
  global.fetch = async (url, options) => {
    if (String(url) !== 'https://proof-rpc.test/') return originalFetch(url,options);
    rpcCalls += 1;
    const body = JSON.parse(options.body);
    assert.equal(body.params.request_type,'view_access_key');
    assert.equal(body.params.public_key,publicKey);
    assert.ok(options.signal);
    if (mode === 'blocked') { notifyRpc(); await rpcGate; return {ok:true,json:async()=>({result:{permission:'FullAccess'}})}; }
    if (mode === 'offline') throw new Error('Temporary RPC outage');
    return {ok:true,json:async()=>mode==='unknown' ? {error:{cause:{name:'UNKNOWN_ACCESS_KEY'}}} : {result:{permission:mode==='full'?'FullAccess':{FunctionCall:{}}}}};
  };
  const post = (route, body={},user='123') => fetch(base+route,{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':user},body:JSON.stringify(body)});
  const makeProof = async (accountId,user='123') => {
    const response = await post('/wallets/near/proof-challenge',{},user);
    assert.equal(response.status,200);
    const challenge = (await response.json()).data;
    const payload = serializeNep413({message:challenge.message,nonce:Buffer.from(challenge.nonce,'base64'),recipient:challenge.recipient});
    const signature = Buffer.from(key.sign(createHash('sha256').update(payload).digest()).signature).toString('base64');
    return {challengeId:challenge.challengeId,signedMessage:{accountId,publicKey,signature}};
  };
  try {
    const proof = await makeProof('owner.near');
    assert.equal((await post('/wallets/near/proof-verify',proof)).status,502);
    assert.ok(!store.players[0].near_wallet_verified);
    mode='full';
    const linked = await post('/wallets/near/proof-verify',proof);
    assert.equal(linked.status,200);
    assert.equal((await linked.json()).data.near_wallet_id,'owner.near');
    const callsAfterSuccess=rpcCalls;
    mode='offline';
    assert.equal((await post('/wallets/near/proof-verify',proof)).status,200);
    assert.equal(rpcCalls,callsAfterSuccess);
    assert.equal((await post('/wallets/near/proof-verify',proof,'456')).status,400);
    const tampered = await makeProof('tampered.near');
    tampered.signedMessage.signature = Buffer.alloc(64).toString('base64');
    assert.equal((await post('/wallets/near/proof-verify',tampered)).status,400);
    assert.equal(rpcCalls,callsAfterSuccess);
    mode='function';
    assert.equal((await post('/wallets/near/proof-verify',await makeProof('limited.near'))).status,400);
    assert.equal(store.players[0].near_wallet_id,'owner.near');
    mode='unknown';
    assert.equal((await post('/wallets/near/proof-verify',await makeProof('missing.near'))).status,400);
    mode='full';
    const conflict=await post('/wallets/near/proof-verify',await makeProof('owner.near','456'),'456');
    assert.equal(conflict.status,409);
    const disconnected=await post('/wallets/near/disconnect');
    assert.equal(disconnected.status,200);
    assert.equal((await disconnected.json()).data.near_wallet_id,'');
    assert.equal(store.players[0].near_wallet_verified,false);
    assert.equal((await post('/wallets/near/proof-verify',proof)).status,400);
    const racingProof = await makeProof('racing.near');
    let releaseRpc;
    rpcGate = new Promise(resolve=>{releaseRpc=resolve;});
    const rpcEntered = new Promise(resolve=>{notifyRpc=resolve;});
    mode='blocked';
    const verifying = post('/wallets/near/proof-verify',racingProof);
    await rpcEntered;
    assert.equal((await post('/wallets/near/disconnect')).status,200);
    releaseRpc();
    assert.equal((await verifying).status,400);
    assert.equal(store.players[0].near_wallet_id,'');
    const unlinkTon=()=>fetch(base+'/wallets/ton',{method:'DELETE',headers:{'x-telegram-user-id':'123'}});
    store.walletLinks=[];
    assert.equal((await unlinkTon()).status,200);
    store.walletLinks=[{id:'ton-link',player_id:'proof-owner',chain:'ton',address:'0:'+ 'a'.repeat(64)}];
    assert.equal((await unlinkTon()).status,200);
    assert.equal(store.walletLinks.length,0);
    assert.equal((await unlinkTon()).status,200);
  } finally {
    global.fetch=originalFetch;
    await new Promise(resolve=>server.close(resolve));
  }
});
