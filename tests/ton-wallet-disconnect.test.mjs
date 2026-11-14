import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('TON disconnect clears the connector even when no server link exists', async () => {
  const source=fs.readFileSync(new URL('../src/components/game/ProfilePanel.jsx',import.meta.url),'utf8');
  const body=source.slice(source.indexOf('  const disconnectTonWallet = async () => {'),source.indexOf('  const xRequest ='));
  let sessionDisconnects=0,error='';
  const context={tonDisconnectBusy:{current:false},setTonDisconnecting:()=>{},setTonWalletError:value=>{error=value;},
    unlinkTonWallet:async()=>{throw Object.assign(new Error('not linked'),{code:'TON_WALLET_NOT_FOUND'});},
    tonConnectUI:{connected:true,disconnect:async()=>{sessionDisconnects++;}},
  };
  const disconnect=vm.runInNewContext(body+'\ndisconnectTonWallet;',context);
  await disconnect();
  assert.equal(sessionDisconnects,1);
  assert.equal(error,'');
  assert.equal(context.tonDisconnectBusy.current,false);
  context.unlinkTonWallet=async()=>{throw Object.assign(new Error('Unauthorized'),{code:'AUTH_REQUIRED'});};
  await disconnect();
  assert.equal(sessionDisconnects,1);
  assert.equal(error,'Unauthorized');
});
