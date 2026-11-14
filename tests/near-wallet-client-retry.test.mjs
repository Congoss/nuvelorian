import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('retry after server failure reuses the signed proof without another wallet prompt', async () => {
  const source = fs.readFileSync(new URL('../src/components/game/ProfilePanel.jsx',import.meta.url),'utf8');
  const body = source.slice(source.indexOf('  const connectNearWallet = async () => {'),source.indexOf('  const xRequest ='));
  let signatures=0,modals=0,verifications=0,linked='',retry=false,errorMessage='',disconnections=0;
  const context = {
    pendingNearProof:{current:null},nearProofBusy:{current:false},profile:{id:'player',language:'en'},atob,AbortController,
    waitForNearWallet:promise=>promise,
    setNearDisconnecting:()=>{},
    setNearConnecting:()=>{},setNearWalletError:value=>{errorMessage=value;},setNearProofRetry:value=>{retry=value;},
    setNearWalletId:value=>{linked=value;},setActiveNearAccount:()=>{},
    onSyncProfile:()=>{},
    unlinkNearWallet:async()=>({near_wallet_id:'',near_wallet_verified:false}),
    disconnectNearSession:async()=>{disconnections++;},
    signNearWalletProof:async()=>{modals++;signatures++;return {account:'owner.near',signedMessage:{accountId:'owner.near',signature:'signed-proof'}};},
    getNearWalletConnector:async()=>({network:'mainnet'}),
    createNearWalletProofChallenge:async()=>({challengeId:'challenge',nonce:Buffer.alloc(32).toString('base64'),message:'link wallet',recipient:'planet4.near',expiresAt:Date.now()+300000}),
    verifyNearWalletProof:async proof=>{
      verifications++;
      assert.equal(proof.signedMessage.signature,'signed-proof');
      if(verifications===1)throw Object.assign(new Error('RPC unavailable'),{code:'NEAR_PROOF_VERIFY_FAILED'});
      return {near_wallet_id:'owner.near'};
    },
  };
  const {connect,disconnect} = vm.runInNewContext(body+'\n({connect:connectNearWallet,disconnect:disconnectNearWallet});',context);
  await connect();
  assert.equal(retry,true);
  assert.equal(context.nearProofBusy.current,false);
  await connect();
  assert.equal(modals,1);
  assert.equal(signatures,1);
  assert.equal(verifications,2);
  assert.equal(linked,'owner.near');
  assert.equal(retry,false);
  assert.equal(context.pendingNearProof.current,null);
  await disconnect();
  assert.equal(linked,'');
  assert.equal(disconnections,1);
  context.createNearWalletProofChallenge=async()=>({challengeId:'old-server',nonce:Buffer.alloc(32).toString('base64')});
  await connect();
  assert.equal(signatures,1);
  assert.equal(verifications,2);
  assert.match(errorMessage,/server needs updating/);
});
