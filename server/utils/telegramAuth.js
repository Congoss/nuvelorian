import crypto from 'node:crypto';
import { serverConfig } from '../config.js';
import { webAuth } from './webAuth.js';

function parseTelegramInitData(initData) {
  if (!initData) return null;
  const searchParams = new URLSearchParams(initData);
  return Object.fromEntries(searchParams.entries());
}

export function verifyTelegramInitData(initData) {
  if (!initData) {
    return { ok: false, reason: 'missing_init_data' };
  }

  if (!serverConfig.telegramBotToken) {
    return { ok: false, reason: 'missing_bot_token' };
  }

  const parsed = parseTelegramInitData(initData);
  const receivedHash = parsed?.hash;
  if (!receivedHash) {
    return { ok: false, reason: 'missing_hash' };
  }

  const entries = Object.entries(parsed)
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(serverConfig.telegramBotToken)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(entries)
    .digest('hex');

  if (!/^[a-f0-9]{64}$/i.test(receivedHash) || !crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(receivedHash, 'hex'))) {
    return { ok: false, reason: 'invalid_hash' };
  }
  const age = Date.now() / 1000 - Number(parsed.auth_date);
  if (!parsed.auth_date || !Number.isFinite(age) || age < -30 || age > 86400) {
    return { ok: false, reason: 'expired_init_data' };
  }
  try {
    const user = JSON.parse(parsed.user);
    if (!Number.isSafeInteger(user.id) || user.id <= 0) throw new Error('Invalid user');
    return { ok: true, reason: null, parsed, user };
  } catch {
    return { ok: false, reason: 'invalid_user' };
  }
}

export function getSessionFromHeaders(headers) {
  const verified = verifyTelegramInitData(headers['x-telegram-init-data']);
  if (verified.ok) {
    const telegramId = String(verified.user.id);
    return {
      telegramId,
      username: verified.user.username || `tg_${telegramId}`,
      email: `telegram_${telegramId}@miniapp.local`,
      initData: headers['x-telegram-init-data'],
      avatar: verified.user.photo_url || '',
      photoUrl: verified.user.photo_url || '',
      startParam: verified.parsed.start_param || '',
      isMock: false,
    };
  }
  // Invalid signed data must never fall back to client-supplied identity.
  if (headers['x-telegram-init-data']) return null;
  const webSession = webAuth.session(headers);
  if (webSession) return webSession;
  if (process.env.NODE_ENV === 'production') return null;
  if (process.env.NODE_ENV !== 'test' && !(serverConfig.telegramUseMock && headers['x-telegram-mock-user'] === 'true')) return null;
  const telegramId = headers['x-telegram-user-id'];
  const username = headers['x-telegram-username'];
  const initData = headers['x-telegram-init-data'];
  const photoUrl = headers['x-telegram-photo-url'];
  const startParam = headers['x-telegram-start-param'];
  const isMock = headers['x-telegram-mock-user'] === 'true';

  if (!telegramId) return null;

  return {
    telegramId: String(telegramId),
    username: username || `tg_${telegramId}`,
    email: `telegram_${telegramId}@miniapp.local`,
    initData: initData || '',
    avatar: photoUrl || '',
    photoUrl: photoUrl || '',
    startParam: startParam || '',
    isMock,
  };
}
