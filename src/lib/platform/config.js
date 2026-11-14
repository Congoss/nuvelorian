const normalizePlatform = (value) => {
  const raw = String(value || '').trim().toLowerCase();

  if (raw === 'telegram') return 'telegram';
  if (raw === 'web') return 'web';
  if (raw === 'base44') return 'base44';
  return 'telegram';
};

const getDefaultLocalApiBaseUrl = (platform) => {
  if (platform !== 'telegram' && platform !== 'web') return '';
  if (typeof window === 'undefined') return '';

  const host = String(window.location.hostname || '').trim().toLowerCase();
  if (!host) {
    return '';
  }

  return `${window.location.origin}/api`;
};

const configuredPlatform = normalizePlatform(import.meta.env.VITE_APP_PLATFORM);
const browserMode = typeof window !== 'undefined' && !window.Telegram?.WebApp?.initData;
const platform = configuredPlatform !== 'base44' && browserMode && import.meta.env.PROD ? 'web' : configuredPlatform;

export const platformConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'Survivor Telegram Game',
  platform,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || getDefaultLocalApiBaseUrl(platform),
  telegram: {
    botUsername: import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'planet_4bot',
    useMock: String(import.meta.env.VITE_TELEGRAM_USE_MOCK || (import.meta.env.DEV ? 'true' : 'false')) === 'true',
  },
  ton: {
    manifestUrl: import.meta.env.VITE_TON_MANIFEST_URL || '/tonconnect-manifest.json',
    network: import.meta.env.VITE_TON_NETWORK || 'mainnet',
  },
  near: {
    network: import.meta.env.VITE_NEAR_NETWORK || 'mainnet',
  },
};

export const isTelegramPlatform = platformConfig.platform === 'telegram';
export const isWebPlatform = platformConfig.platform === 'web';
export const usesTelegramBackend = isTelegramPlatform || isWebPlatform;
export const hasRemoteGameApi = Boolean(platformConfig.apiBaseUrl);
