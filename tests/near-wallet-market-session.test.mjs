import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/lib/platform/nearWallet.js',import.meta.url),'utf8').replace("import { platformConfig } from './config';",'').replaceAll('export ','');
const helper=()=>vm.runInNewContext(source+'\ngetNearTransactionWallet;',{setTimeout,clearTimeout});

test('repeated purchases reuse connected wallet and accounts without another connect prompt',async()=>{
 let connects=0,signatures=0;
 const wallet={signAndSendTransaction:async()=>{signatures++;}};
 const accounts=[{accountId:'buyer.near'}];
 const connector={getConnectedWallet:async()=>({wallet,accounts}),connect:async()=>{connects++;throw Error('Unnecessary connection');}};
 const get=helper();
 for(let i=0;i<2;i++){
  const session=await get(connector);
  assert.equal(session.accounts,accounts);assert.equal(session.wallet,wallet);
  await session.wallet.signAndSendTransaction();
 }
 assert.equal(connects,0);assert.equal(signatures,2);
});

test('missing or revoked session connects once; next purchase restores it',async()=>{
 let connected=false,connects=0;
 const accounts=[{accountId:'buyer.near'}],wallet={getAccounts:async()=>accounts};
 const connector={network:'mainnet',getConnectedWallet:async()=>{if(!connected)throw Error('No accounts found');return {wallet,accounts};},connect:async()=>{connects++;connected=true;return wallet;}};
 const get=helper();
 assert.equal((await get(connector)).wallet,wallet);
 assert.equal((await get(connector)).wallet,wallet);
 assert.equal(connects,1);
});

test('provider failures never trigger an extra authorization popup',async()=>{
 let connects=0;
 const get=helper(),error=Object.assign(Error('Provider timeout'),{code:'NEAR_WALLET_TIMEOUT'});
 await assert.rejects(get({getConnectedWallet:async()=>{throw error;},connect:async()=>{connects++;}}),e=>e===error);
 assert.equal(connects,0);
});
