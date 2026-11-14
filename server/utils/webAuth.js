import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { serverConfig } from '../config.js';

const GUEST_ID = /^g_[A-Za-z0-9_-]{22}$/;
export const isGuestId = (value) => GUEST_ID.test(String(value || ''));

export function createWebAuth({ secret, secure = true, now = Date.now } = {}) {
  const launches = new Map();
  const cookieName = secure ? '__Host-p4_web_session' : 'p4_web_session';
  const sessionLifetime = 7 * 24 * 60 * 60;
  const digest = (value) => createHash('sha256').update(value).digest('hex');
  const sign = (payload) => createHmac('sha256', secret).update('p4-web-session:' + payload).digest('base64url');
  const cookie = (value, age = sessionLifetime) => `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? '; Secure' : ''}`;
  const sessionCookie = (session) => {
    const guest = !session?.telegramId && !session?.nearAccountId && isGuestId(session?.guestId);
    if (!secret || session?.isMock || !(guest || /^\d+$/.test(String(session?.telegramId || '')) || /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(String(session?.nearAccountId || '')))) throw new Error('Verified game session required');
    // Guests keep their progress for 30 days in this browser unless they link a NEAR wallet.
    const lifetime = guest ? 30 * 24 * 60 * 60 : sessionLifetime;
    const payload = Buffer.from(JSON.stringify({ telegramId: String(session.telegramId || ''), username: session.username || '', ...(session.nearAccountId ? { nearAccountId: session.nearAccountId } : {}), ...(guest ? { guestId: session.guestId } : {}), expiresAt: now() + lifetime * 1000 })).toString('base64url');
    return cookie(`${payload}.${sign(payload)}`, lifetime);
  };
  return {
    createSession(session) { return sessionCookie(session); },
    createGuestId() { return 'g_' + randomBytes(16).toString('base64url'); },
    createLaunch(session) {
      if (!secret || !session?.telegramId || session.isMock) throw new Error('Verified Telegram session required');
      for (const [key, launch] of launches) if (launch.expiresAt <= now() || launch.session.telegramId === session.telegramId) launches.delete(key);
      if (launches.size >= 10000) throw new Error('Try again later');
      const token = randomBytes(32).toString('base64url');
      launches.set(digest(token), { session: { telegramId: String(session.telegramId), username: session.username || '', email: session.email }, expiresAt: now() + 120000 });
      return token;
    },
    exchange(token) {
      if (!secret || typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('Invalid web launch');
      const key = digest(token);
      const launch = launches.get(key);
      launches.delete(key);
      if (!launch || launch.expiresAt <= now()) throw new Error('Web launch expired. Open the web game from your Telegram profile again.');
      return sessionCookie(launch.session);
    },
    session(headers = {}) {
      if (!secret) return null;
      const value = String(headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
      if (!value || value.length > 2048) return null;
      const [payload, signature, extra] = value.split('.');
      if (!payload || !signature || extra) return null;
      const expected = Buffer.from(sign(payload));
      const received = Buffer.from(signature);
      if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
      try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
        const telegram = /^\d+$/.test(data.telegramId);
        const near = typeof data.nearAccountId === 'string' && data.nearAccountId.length >= 2 && data.nearAccountId.length <= 64 && /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(data.nearAccountId);
        const guest = !telegram && !near && isGuestId(data.guestId);
        if ((!telegram && !near && !guest) || !Number.isFinite(data.expiresAt) || data.expiresAt <= now()) return null;
        if (guest) return { telegramId: '', username: data.username, email: `guest_${data.guestId}@miniapp.local`, guestId: data.guestId, guest: true, initData: '', isMock: false, source: 'web' };
        return { telegramId: data.telegramId, username: data.username, email: telegram ? `telegram_${data.telegramId}@miniapp.local` : `near_${data.nearAccountId}@miniapp.local`, initData: '', isMock: false, source: 'web', ...(data.nearAccountId ? { nearAccountId: data.nearAccountId } : {}) };
      } catch { return null; }
    },
    clearCookie() { return cookie('', 0); },
  };
}

export const webAuth = createWebAuth({ secret: process.env.WEB_SESSION_SECRET || serverConfig.telegramBotToken, secure: process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development' });
