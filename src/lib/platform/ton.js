import { CHAIN, THEME } from '@tonconnect/ui-react';
import { isTelegramPlatform, platformConfig } from '@/lib/platform/config';

export function getTonManifestUrl() {
  const manifestUrl = String(platformConfig.ton.manifestUrl || '/tonconnect-manifest.json').trim();

  if (typeof window === 'undefined') {
    return manifestUrl;
  }

  return manifestUrl.startsWith('http://') || manifestUrl.startsWith('https://')
    ? manifestUrl
    : new URL(manifestUrl, window.location.origin).toString();
}

export function getTonConnectProviderProps() {
  const botUsername = String(platformConfig.telegram.botUsername || '').trim();

  return {
    manifestUrl: getTonManifestUrl(),
    language: 'en',
    uiPreferences: {
      theme: THEME.DARK,
      borderRadius: 's',
    },
    actionsConfiguration: isTelegramPlatform && botUsername
      ? {
          twaReturnUrl: `https://t.me/${botUsername}`,
        }
      : undefined,
    walletsRequiredFeatures: {
      sendTransaction: {},
    },
    analytics: {
      mode: 'off',
    },
  };
}

export function getTonChainId() {
  return platformConfig.ton.network === 'testnet' ? CHAIN.TESTNET : CHAIN.MAINNET;
}

// TON Connect expects a message body as a base64-encoded BOC.  A text comment
// is a single ordinary cell whose first 32 bits are zero.
export function createTonCommentPayload(comment) {
  const text = new TextEncoder().encode(String(comment || ''));
  const bodySize = 4 + text.length;
  if (bodySize > 127) {
    throw new Error('TON payment comment is too long');
  }

  const boc = new Uint8Array(13 + bodySize);
  boc.set([0xb5, 0xee, 0x9c, 0x72, 0x01, 0x01, 0x01, 0x01, 0x00, bodySize + 2, 0x00, 0x00, bodySize * 2, 0x00, 0x00, 0x00, 0x00], 0);
  boc.set(text, 17);
  let binary = '';
  for (const byte of boc) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function getTonNetworkName(chainId) {
  return chainId === CHAIN.TESTNET ? 'testnet' : 'mainnet';
}

export function getTonWalletProviderName(wallet) {
  if (!wallet) return 'tonconnect';

  const appName = wallet.device?.appName || wallet.name || '';
  return appName ? `tonconnect:${String(appName).toLowerCase()}` : 'tonconnect';
}
