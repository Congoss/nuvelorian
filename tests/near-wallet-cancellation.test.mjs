import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function walletModule(connector) {
  const source = fs.readFileSync(new URL('../src/lib/platform/nearWallet.js', import.meta.url), 'utf8')
    .replace("import { platformConfig } from './config';", '')
    .replaceAll('export ', '');
  return vm.runInNewContext(source + '\nconnectorPromise = Promise.resolve(testConnector); ({waitForNearWallet,signNearWalletProof,disconnectNearSession});', {
    testConnector: connector, setTimeout, clearTimeout, Uint8Array, atob,
    document: { querySelectorAll: () => [] },
  });
}

test('a stalled wallet can time out or be cancelled without waiting for its response', async () => {
  const { waitForNearWallet } = walletModule({});
  await assert.rejects(waitForNearWallet(new Promise(() => {}), { timeoutMs: 5 }), { code: 'NEAR_WALLET_TIMEOUT' });
  const controller = new AbortController();
  const pending = waitForNearWallet(new Promise(() => {}), { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('connection returns its signed proof without a second account or signature popup', async () => {
  let listener;
  const connector = {
    on: (event, callback) => { listener = callback; },
    off: (event, callback) => { assert.equal(callback, listener); listener = null; },
    connect: async ({ signMessageParams }) => {
      assert.equal(signMessageParams.message, 'Link wallet');
      assert.equal(signMessageParams.nonce.length, 32);
      listener({ accounts: [{ accountId: 'owner.near', signedMessage: { signature: 'proof' } }] });
    },
  };
  const { signNearWalletProof } = walletModule(connector);
  const result = await signNearWalletProof({ message: 'Link wallet', recipient: 'planet4.near', nonce: Buffer.alloc(32).toString('base64') });
  assert.equal(result.account, 'owner.near');
  assert.equal(result.signedMessage.signature, 'proof');
  assert.equal(listener, null);
});

test('disconnect clears the selected session even when wallet sign-out fails', async () => {
  let selected = 'meteor-wallet';
  let signedOut = false;
  const wallet = {};
  const { disconnectNearSession } = walletModule({
    storage: { get: async () => selected, remove: async () => { selected = null; } },
    wallet: async id => { assert.equal(id, 'meteor-wallet'); return wallet; },
    disconnect: async actual => { assert.equal(actual, wallet); signedOut = true; throw new Error('Wallet unavailable'); },
  });
  await disconnectNearSession();
  assert.equal(selected, null);
  assert.equal(signedOut, true);
});

test('disconnect during signing ignores the late signed proof and allows reconnect', async () => {
  const source = fs.readFileSync(new URL('../src/components/game/ProfilePanel.jsx', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('  const connectNearWallet = async () => {'), source.indexOf('  const xRequest ='));
  let finishSigning, signingStarted, verifies = 0, linked = 'old.near';
  const started = new Promise(resolve => { signingStarted = resolve; });
  const context = {
    AbortController, pendingNearProof: { current: null }, nearProofBusy: { current: false }, profile: { id: 'p', language: 'en' },
    setNearConnecting() {}, setNearDisconnecting() {}, setNearWalletError() {}, setNearProofRetry() {}, setActiveNearAccount() {}, onSyncProfile() {},
    setNearWalletId: value => { linked = value; },
    waitForNearWallet: promise => promise,
    createNearWalletProofChallenge: async () => ({ expiresAt: Date.now() + 60000 }),
    signNearWalletProof: () => { signingStarted(); return new Promise(resolve => { finishSigning = resolve; }); },
    verifyNearWalletProof: async () => { verifies++; },
    unlinkNearWallet: async () => ({ near_wallet_id: '' }), disconnectNearSession: async () => {},
  };
  const handlers = vm.runInNewContext(body + '\n({connect:connectNearWallet,disconnect:disconnectNearWallet});', context);
  const pending = handlers.connect();
  await started;
  await handlers.disconnect();
  finishSigning({ account: 'late.near', signedMessage: {} });
  await pending;
  assert.equal(verifies, 0);
  assert.equal(linked, '');
  assert.equal(context.nearProofBusy.current, false);
});
