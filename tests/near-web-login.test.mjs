import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { KeyPair } from '@near-js/crypto';
import { serializeNep413 } from '@near-wallet-selector/core';
process.env.NODE_ENV='test';
process.env.WEB_SESSION_SECRET='web-near-test';
process.env.NEAR_WALLET_RPC_URL='https://login-rpc.test/';
const {createNearWebLogin}=await import('../server/utils/nearWebLogin.js');
const key=KeyPair.fromRandom('ed25519');
function proof(data,accountId='owner.near') {
 const serialized=serializeNep413({message:data.message,nonce:Buffer.from(data.nonce,'base64'),recipient:data.recipient});
 return {challengeId:data.challengeId,signedMessage:{accountId,publicKey:key.getPublicKey().toString(),signature:Buffer.from(key.sign(createHash('sha256').update(serialized).digest()).signature).toString('base64')}};
}
const player={id:'same-player',telegram_id:'123',created_by:'telegram_123@miniapp.local',near_wallet_id:'owner.near',near_wallet_verified:true,level:12,tentacles:500};
test('NEAR login requires browser binding, valid signature, verified unique account and one-time challenge',async()=>{
 let clock=100000, calls=0;
 const auth=createNearWebLogin({now:()=>clock,verifyKey:async()=>{calls++;return true;}});
 const c=auth.challenge({}), headers={cookie:c.cookie.split(';')[0]}, body=proof(c.data);
 await assert.rejects(auth.verify({},body,[player],'mainnet'),{code:'NEAR_LOGIN_INVALID'});
 await assert.rejects(auth.verify(headers,{...body,signedMessage:{...body.signedMessage,signature:Buffer.alloc(64).toString('base64')}},[player],'mainnet'),{code:'NEAR_LOGIN_INVALID'});
 assert.equal(calls,0);
 const session=await auth.verify(headers,body,[player],'mainnet');
 assert.equal(session.telegramId,'123');assert.equal(session.nearAccountId,'owner.near');
 await assert.rejects(auth.verify(headers,body,[player],'mainnet'),{code:'NEAR_LOGIN_INVALID'});
 for(const players of [[{...player,near_wallet_verified:false}],[{...player,is_banned:true}],[player,{...player,id:'duplicate'}]]) {
  const next=auth.challenge({}), h={cookie:next.cookie.split(';')[0]};
  await assert.rejects(auth.verify(h,proof(next.data),players,'mainnet'),{code:'NEAR_LOGIN_NOT_LINKED'});
 }
 const expired=auth.challenge({});clock+=300001;
 await assert.rejects(auth.verify({cookie:expired.cookie.split(';')[0]},proof(expired.data),[player],'mainnet'),{code:'NEAR_LOGIN_INVALID'});
});
test('NEAR login retries RPC failure but rejects keys without account ownership',async()=>{
 let mode='offline';const auth=createNearWebLogin({verifyKey:async()=>{if(mode==='offline')throw Error('RPC');return mode==='valid';}});
 const c=auth.challenge({}),h={cookie:c.cookie.split(';')[0]},body=proof(c.data);
 await assert.rejects(auth.verify(h,body,[player],'mainnet'),/RPC/);
 mode='invalid';await assert.rejects(auth.verify(h,body,[player],'mainnet'),{code:'NEAR_LOGIN_INVALID'});
 mode='valid';assert.equal((await auth.verify(h,body,[player],'mainnet')).telegramId,'123');
});
test('HTTP NEAR sign-in resumes existing progress, rejects replay/cross-origin and revokes unlinked wallet session',async()=>{
 const [{createApp},{store},{playerDb},{paymentDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js'),import('../server/data/payment-db.js')]);
 store.init=playerDb.init=paymentDb.init=async()=>{};store.persistSoon=()=>{};store.persistNow=async()=>{};playerDb.flushDirtyPlayers=async()=>{};
 store.players=playerDb.attachPlayers([{...player}]);
 const realFetch=global.fetch;
 global.fetch=async(url,options)=>String(url)==='https://login-rpc.test/'?{ok:true,json:async()=>({result:{permission:'FullAccess'}})}:realFetch(url,options);
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=(route,body={},cookie='',origin=base)=>fetch(base+'/api/auth/web/'+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
 try {
  assert.equal((await post('near/challenge',{},'','https://evil.test')).status,403);
  let res=await post('near/challenge');assert.equal(res.status,200);
  const binding=res.headers.get('set-cookie').split(';')[0];const body=proof((await res.json()).data);
  assert.equal((await post('near/verify',body)).status,401);
  res=await post('near/verify',body,binding);assert.equal(res.status,200);
  const cookie=res.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('near/verify',body,binding)).status,401);
  res=await fetch(base+'/api/players/me',{headers:{Cookie:cookie}});assert.equal(res.status,200);
  const loaded=(await res.json()).data;assert.equal(loaded.id,player.id);assert.equal(loaded.tentacles,500);assert.equal(store.players.length,1);
  store.players[0].near_wallet_verified=false;
  assert.equal((await fetch(base+'/api/players/me',{headers:{Cookie:cookie}})).status,401);
  const signIn = async account => {
    const ch=await post('near/challenge'); const binding=ch.headers.get('set-cookie').split(';')[0];
    const response=await post('near/verify',proof((await ch.json()).data,account),binding);
    assert.equal(response.status,200);return response.headers.get('set-cookie').split(';')[0];
  };
  const aliceCookie=await signIn('alice.near');
  const aliceRes=await fetch(base+'/api/players/me',{headers:{Cookie:aliceCookie}});
  assert.equal(aliceRes.status,200);const alice=(await aliceRes.json()).data;
  assert.equal(alice.telegram_id,'');assert.equal(alice.near_wallet_id,'alice.near');assert.equal(alice.near_wallet_verified,true);
  const bobCookie=await signIn('bob.near');
  const bob=(await(await fetch(base+'/api/players/me',{headers:{Cookie:bobCookie}})).json()).data;
  assert.notEqual(bob.id,alice.id);assert.notEqual(bob.id,player.id);
  const forbidden=await fetch(base+'/api/players/'+bob.id,{method:'PATCH',headers:{Cookie:aliceCookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({nickname:'changed-by-other-wallet'})});
  assert.equal(forbidden.status,403);

  const again=await signIn('alice.near');
  const resumed=(await(await fetch(base+'/api/players/me',{headers:{Cookie:again}})).json()).data;
  assert.equal(resumed.id,alice.id);assert.equal(store.players.length,3);
  const unlink=await fetch(base+'/api/wallets/near/disconnect',{method:'POST',headers:{Cookie:aliceCookie,Origin:base}});
  assert.equal(unlink.status,409);

 } finally {global.fetch=realFetch;await new Promise(r=>server.close(r));}
});
