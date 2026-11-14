import test from 'node:test';
import assert from 'node:assert/strict';
import {KeyPair} from '@near-js/crypto';
import {subaccountPlan,encryptSubaccountBackup,decryptSubaccountBackup,SUBACCOUNT_DEPOSIT} from '../src/lib/nearSubaccount.js';
import {createSubaccountReader} from '../server/services/near-subaccount-reader.js';

test('subaccount transaction creates only an immediate child, funds 0.1 NEAR and adds the chosen child key',()=>{
 const publicKey=KeyPair.fromRandom('ed25519').getPublicKey().toString();
 const plan=subaccountPlan('nuvelorian.near','tor',publicKey);
 assert.equal(plan.network,'mainnet');assert.equal(plan.signerId,'nuvelorian.near');assert.equal(plan.receiverId,'tor.nuvelorian.near');
 assert.deepEqual(plan.actions,[{type:'CreateAccount'},{type:'Transfer',params:{deposit:SUBACCOUNT_DEPOSIT}},{type:'AddKey',params:{publicKey,accessKey:{nonce:0,permission:'FullAccess'}}}]);
 for(const [parent,prefix,key] of [['a'.repeat(64),'tor',publicKey],['alice.testnet','tor',publicKey],['alice.near','x.y',publicKey],['alice.near','tor','private:key'],['alice.near','x'.repeat(64),publicKey]])assert.throws(()=>subaccountPlan(parent,prefix,key));
});
test('encrypted child backup survives restore and detects wrong password or tampering',async()=>{
 const key=KeyPair.fromRandom('ed25519'),credentials={account_id:'tor.nuvelorian.near',network:'mainnet',public_key:key.getPublicKey().toString(),private_key:key.toString()};
 const backup=await encryptSubaccountBackup(credentials,'a separate long password');
 assert(!JSON.stringify(backup).includes(credentials.private_key));
 assert.deepEqual(await decryptSubaccountBackup(backup,'a separate long password'),credentials);
 await assert.rejects(decryptSubaccountBackup(backup,'another password'));
 await assert.rejects(decryptSubaccountBackup({...backup,iv:backup.salt},'a separate long password'));
 await assert.rejects(encryptSubaccountBackup(credentials,'short'));
});
test('read-only RPC fails closed on connection errors and verifies the exact full access key',async()=>{
 const publicKey=KeyPair.fromRandom('ed25519').getPublicKey().toString(),calls=[];
 const reader=createSubaccountReader({fetchImpl:async(url,options)=>{
  assert.equal(url,'https://free.rpc.fastnear.com');const request=JSON.parse(options.body);calls.push(request);
  assert.equal(request.method,'query');assert.equal(request.params.finality,'final');
  return {ok:true,json:async()=>({result:request.params.request_type==='view_account'?{amount:SUBACCOUNT_DEPOSIT}:{permission:'FullAccess'}})};
 }});
 assert.deepEqual(await reader('tor.nuvelorian.near',publicKey),{network:'mainnet',account:'tor.nuvelorian.near',exists:true,balance:SUBACCOUNT_DEPOSIT,keyMatches:true});
 assert.equal(calls[1].params.public_key,publicKey);
 const missing=createSubaccountReader({fetchImpl:async()=>({ok:true,json:async()=>({error:{cause:{name:'UNKNOWN_ACCOUNT'}}})})});
 assert.equal((await missing('tor.nuvelorian.near')).exists,false);
 const broken=createSubaccountReader({fetchImpl:async()=>({ok:true,json:async()=>({error:{cause:{name:'INTERNAL_ERROR'}}})})});
 await assert.rejects(broken('tor.nuvelorian.near'),/RPC_UNAVAILABLE/);
 await assert.rejects(reader('alice.testnet'),/INVALID_MAINNET/);
});
