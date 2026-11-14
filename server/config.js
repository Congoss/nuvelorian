import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadLocalEnv() {
  const envFiles = ['.env.local', '.env'];

  const stripQuotes = (value) => {
    const trimmed = String(value || '').trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  };

  for (const file of envFiles) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;

    const lines = readFileSync(path, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) continue;

      const key = trimmed.slice(0, equalsIndex).trim();
      const value = stripQuotes(trimmed.slice(equalsIndex + 1));
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadLocalEnv();

export const serverConfig = {
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || '0.0.0.0',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  paymentRatesRefreshMs: Number(process.env.PAYMENT_RATES_REFRESH_MS || 10 * 60 * 1000),
  tonReceiver: process.env.TON_RECEIVER || 'UQB9cLJrCItp1lg_ebAvAQ3Ui5AHn_ouzXaqe9BYblVzguMv',
  nearReceiver: process.env.NEAR_RECEIVER || 'nuvelorian.near',
  starsPerUsd: Number(process.env.STARS_PER_USD || 100),
  nearNetwork: process.env.NEAR_NETWORK || process.env.VITE_NEAR_NETWORK || 'mainnet',
  telegramUseMock: String(process.env.VITE_TELEGRAM_USE_MOCK || 'false') === 'true',
  xClientId: process.env.X_CLIENT_ID || '',
  xClientSecret: process.env.X_CLIENT_SECRET || '',
  xApiBearerToken: process.env.X_API_BEARER_TOKEN || '',
  xOAuthRedirectUri: process.env.X_OAUTH_REDIRECT_URI || '',
  xTokenEncryptionKey: process.env.X_TOKEN_ENCRYPTION_KEY || '',
};
