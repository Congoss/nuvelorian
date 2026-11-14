import { platformConfig } from './config';

let connectorPromise;
let activeAccountId = '';

export function waitForNearWallet(promise, { signal, timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    let timer;
    const finish = (callback, value) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      callback(value);
    };
    const abort = () => finish(reject, Object.assign(new Error('Wallet connection cancelled'), { name: 'AbortError' }));
    Promise.resolve(promise).then(value => finish(resolve, value), error => finish(reject, error));
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => finish(reject, Object.assign(new Error('NEAR wallet did not respond. Close the wallet window and try again.'), { code: 'NEAR_WALLET_TIMEOUT' })), timeoutMs);
  });
}

export async function signNearWalletProof(challenge, { signal, forceSelect = false } = {}) {
  const connector = await waitForNearWallet(getNearWalletConnector(), { signal });
  let signedAccount;
  const onSigned = ({ accounts }) => { signedAccount = accounts?.[0]; };
  connector.on('wallet:signInAndSignMessage', onSigned);
  try {
    const nonce = Uint8Array.from(atob(challenge.nonce), value => value.charCodeAt(0));
    const walletId=forceSelect?await waitForNearWallet(connector.selectWallet({features:{signInAndSignMessage:true}}),{signal}):undefined;
    await waitForNearWallet(connector.connect({ ...(walletId?{walletId}:{}),signMessageParams: {
      message: challenge.message, recipient: challenge.recipient, nonce,
    } }), { signal });
    if (!signedAccount?.accountId || !signedAccount?.signedMessage) throw new Error('NEAR wallet did not return a signed proof');
    return { account: signedAccount.accountId, signedMessage: signedAccount.signedMessage };
  } catch (error) {
    if (error?.name === 'AbortError' || error?.code === 'NEAR_WALLET_TIMEOUT') {
      document.querySelectorAll('.hot-connector-popup .modal-container').forEach(modal => modal.click());
    }
    throw error;
  } finally {
    connector.off('wallet:signInAndSignMessage', onSigned);
  }
}

export async function getNearWalletConnector() {
  if (!connectorPromise) {
    connectorPromise = import('@hot-labs/near-connect')
      .then(({ NearConnector }) => new NearConnector({
        network: platformConfig.near.network,
        autoConnect: false,
        footerBranding: null,
      }))
      .catch((error) => {
        connectorPromise = undefined;
        throw error;
      });
  }
  return connectorPromise;
}

export async function openNearWalletModal() {
  const connector = await getNearWalletConnector();
  const wallet = await connector.connect();
  const accounts = await wallet.getAccounts({ network: connector.network });
  activeAccountId = accounts[0]?.accountId || '';
  return wallet;
}

export function getActiveNearAccount() {
  return activeAccountId;
}

export function setActiveNearAccount(accountId) {
  activeAccountId = String(accountId || '').trim();
}

export async function disconnectNearSession() {
  const previous = connectorPromise || (typeof localStorage!=='undefined'&&localStorage.getItem('selected-wallet')?getNearWalletConnector():null);
  activeAccountId = '';
  connectorPromise = undefined;
  try {
    if (previous) {
      const connector = await waitForNearWallet(previous, { timeoutMs: 2000 });
      const walletId = await connector.storage.get('selected-wallet');
      await connector.storage.remove('selected-wallet');
      if (walletId) {
        const wallet = await waitForNearWallet(connector.wallet(walletId), { timeoutMs: 2000 });
        await waitForNearWallet(connector.disconnect(wallet), { timeoutMs: 2000 });
      }
    }
  } catch {
    // Profile unlink must not depend on a wallet popup responding to sign-out.
  } finally {
    if (typeof localStorage !== 'undefined' && !connectorPromise) localStorage.removeItem('selected-wallet');
  }
}

export async function sendNearTransfer({ receiverId, amount, signerId }) {
  const connector = await getNearWalletConnector();
  let accountId = String(signerId || activeAccountId).trim();

  if (!accountId) {
    try {
      const connected = await connector.getConnectedWallet();
      accountId = String(connected.accounts[0]?.accountId || '').trim();
      activeAccountId = accountId;
    } catch {
      const wallet = await openNearWalletModal();
      const accounts = await wallet.getAccounts({ network: connector.network });
      accountId = String(accounts[0]?.accountId || '').trim();
    }
  }
  if (!accountId) throw new Error('Connect a NEAR wallet, then try again');

  const wallet = await connector.wallet();
  const { actionCreators } = await import('@near-wallet-selector/core');
  const result = await wallet.signAndSendTransaction({
    network: connector.network,
    signerId: accountId,
    receiverId: String(receiverId || '').trim(),
    actions: [actionCreators.transfer(BigInt(String(amount || '0')))],
  });
  activeAccountId = accountId;
  return result;
}
