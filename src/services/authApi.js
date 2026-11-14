import { rateLimitedFetch } from '@/lib/rateLimitedFetch.js';
import { syncServerClock } from '@/lib/serverClock.js';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client.js';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { isTelegramPlatform, isWebPlatform, usesTelegramBackend, platformConfig } from '@/lib/platform/config';
import { getTelegramSession } from '@/lib/platform/telegram';
import { bootstrapCurrentPlayer } from '@/services/gameApi';
import { initializeWebSession } from './webSession';

function setBootDebug(patch = {}) {
  if (typeof window === 'undefined') return;
  const current = window.__tgBootDebug || {};
  window.__tgBootDebug = { ...current, ...patch };
}

function createPublicAppClient() {
  return createAxiosClient({
    baseURL: '/api/apps/public',
    headers: {
      'X-App-Id': appParams.appId,
    },
    token: appParams.token,
    interceptResponses: true,
  });
}

let bootstrapCachePromise = null;
let bootstrapCacheValue = null;

function resetBootstrapCache() {
  bootstrapCachePromise = null;
  bootstrapCacheValue = null;
}

function createTelegramHeaders() {
  const telegramSession = getTelegramSession();
  if (!telegramSession) {
    const error = new Error('Telegram session is not available');
    error.status = 401;
    throw error;
  }

  const headers = {
    Accept: 'application/json',
  };

  if (telegramSession.initData) {
    headers['X-Telegram-Init-Data'] = telegramSession.initData;
  }

  if (telegramSession.telegramId) {
    headers['X-Telegram-User-Id'] = String(telegramSession.telegramId);
  }

  if (telegramSession.username) {
    headers['X-Telegram-Username'] = telegramSession.username;
  }

  if (telegramSession.photoUrl) {
    headers['X-Telegram-Photo-Url'] = telegramSession.photoUrl;
  }

  if (telegramSession.startParam) {
    headers['X-Telegram-Start-Param'] = telegramSession.startParam;
  }

  if (telegramSession.source === 'mock') {
    headers['X-Telegram-Mock-User'] = 'true';
  }

  return { telegramSession, headers };
}

async function fetchTelegramBackendSession() {
  const apiBaseUrl = String(platformConfig.apiBaseUrl || '').trim();
  if (!apiBaseUrl) {
    return null;
  }

  const telegramSession = getTelegramSession();
  if (!telegramSession) {
    return null;
  }

  const { headers } = createTelegramHeaders();
  setBootDebug({
    hasTelegramObject: Boolean(window.Telegram?.WebApp),
    hasInitData: Boolean(window.Telegram?.WebApp?.initData),
    initDataLength: window.Telegram?.WebApp?.initData?.length || 0,
    authMeStatus: 'pending',
    bootStatus: 'auth_me_request',
    lastFailingEndpoint: null,
    authMeErrorCode: null,
  });
  console.info('[bootStatus]', {
    stage: 'auth_me_request',
    hasTelegramObject: Boolean(window.Telegram?.WebApp),
    hasInitData: Boolean(window.Telegram?.WebApp?.initData),
  });
  const response = await rateLimitedFetch(`${apiBaseUrl.replace(/\/+$/, '')}/auth/me`, {
    method: 'GET',
    cache: 'no-store',
    headers,
  });

  syncServerClock(response);
  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    const text = await response.text();
    payload = text ? { message: text } : null;
  }

  if (!response.ok) {
    setBootDebug({
      authMeStatus: response.status,
      authMeErrorCode: payload?.code || payload?.error || 'AUTH_ME_FAILED',
      bootStatus: 'auth_me_failed',
      lastFailingEndpoint: '/auth/me',
    });
    console.warn('[bootStatus]', {
      stage: 'auth_me_failed',
      endpoint: '/auth/me',
      status: response.status,
      body: payload ? { message: payload.message, code: payload.code, error: payload.error } : null,
      hasTelegramObject: Boolean(window.Telegram?.WebApp),
      hasInitData: Boolean(window.Telegram?.WebApp?.initData),
    });
    const error = new Error(payload?.message || 'Failed to fetch Telegram backend session');
    error.status = response.status;
    error.code = payload?.code || 'TELEGRAM_BACKEND_AUTH_FAILED';
    error.details = payload;
    throw error;
  }
  setBootDebug({
    authMeStatus: response.status,
    authMeErrorCode: null,
    bootStatus: 'auth_me_success',
  });

  const sessionData = payload?.data?.session || telegramSession;
  return {
    ...telegramSession,
    ...sessionData,
    backendPlayer: payload?.data?.player || null,
  };
}

async function fetchTelegramBackendBootstrap() {
  const apiBaseUrl = String(platformConfig.apiBaseUrl || '').trim();
  if (!apiBaseUrl) {
    return null;
  }

  const telegramSession = getTelegramSession();
  if (!telegramSession) {
    return null;
  }

  const { headers } = createTelegramHeaders();
  const response = await rateLimitedFetch(`${apiBaseUrl.replace(/\/+$/, '')}/players/bootstrap`, {
    method: 'POST',
    cache: 'no-store',
    headers,
  });

  syncServerClock(response);
  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) payload = await response.json();
  else payload = null;

  if (!response.ok) {
    const error = new Error(payload?.message || 'Failed to fetch Telegram bootstrap');
    error.status = response.status;
    error.code = payload?.code || 'TELEGRAM_BOOTSTRAP_FAILED';
    error.details = payload;
    throw error;
  }

  const sessionData = payload?.data?.session || telegramSession;
  const bootstrapData = payload?.data?.player || payload?.data || null;
  return {
    ...telegramSession,
    ...sessionData,
    bootstrap: payload?.data?.bootstrap || null,
    player: bootstrapData,
    backendPlayer: bootstrapData,
  };
}

export async function getAppPublicSettings() {
  if (isTelegramPlatform || isWebPlatform) {
    return {
      id: 'telegram-mini-app',
      public_settings: {
        auth_provider: 'telegram',
      },
    };
  }

  const client = createPublicAppClient();
  return client.get(`/prod/public-settings/by-id/${appParams.appId}`);
}

export async function getCurrentUser() {
  if (usesTelegramBackend) {
    try {
      const backendSession = await fetchTelegramBackendSession();
      if (backendSession) {
        return backendSession;
      }
    } catch (error) {
      if (isWebPlatform) throw error;
      if (import.meta.env.PROD && (error.status === 401 || error.status === 403)) {
        throw error;
      }
      console.warn('Telegram backend session fetch failed, falling back to local Telegram session:', error);
    }

    const telegramSession = getTelegramSession();
    if (!telegramSession) {
      const error = new Error('Telegram session is not available');
      error.status = 401;
      throw error;
    }

    return telegramSession;
  }

  return base44.auth.me();
}

export async function getGameBootstrap() {
  await initializeWebSession();
  if (bootstrapCacheValue) {
    return bootstrapCacheValue;
  }
  if (bootstrapCachePromise) {
    return bootstrapCachePromise;
  }

  bootstrapCachePromise = (async () => {
    if (usesTelegramBackend) {
      try {
        const bootstrap = await fetchTelegramBackendBootstrap();
        if (bootstrap) return bootstrap;
      } catch (error) {
        if (isWebPlatform || error.status === 429) throw error;
        if (import.meta.env.PROD && (error.status === 401 || error.status === 403)) {
          throw error;
        }
        console.warn('Telegram bootstrap fetch failed, falling back to local Telegram session:', error);
      }

      const telegramSession = getTelegramSession();
      if (!telegramSession) {
        const error = new Error('Telegram session is not available');
        error.status = 401;
        throw error;
      }

      return { ...telegramSession, bootstrap: null, backendPlayer: null };
    }

    const currentUser = await base44.auth.me();
    const player = await bootstrapCurrentPlayer(currentUser);
    return {
      ...currentUser,
      ...player,
      player,
      bootstrap: {
        player,
        inventory: null,
        fishing_state: null,
        progression: null,
        daily_tasks_state: null,
        leaderboard_meta: null,
        meta: null,
      },
      backendPlayer: player,
    };
  })();

  try {
    bootstrapCacheValue = await bootstrapCachePromise;
    return bootstrapCacheValue;
  } finally {
    bootstrapCachePromise = null;
  }
}

export async function logout(redirectUrl) {
  resetBootstrapCache();
  if (isWebPlatform) await rateLimitedFetch('/api/auth/web/logout', { method: 'POST', credentials: 'same-origin' });
  if (usesTelegramBackend) {
    if (redirectUrl && typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
    return;
  }

  if (redirectUrl) {
    base44.auth.logout(redirectUrl);
    return;
  }

  base44.auth.logout();
}

export function redirectToLogin(redirectUrl) {
  if (isTelegramPlatform || isWebPlatform) {
    if (typeof window !== 'undefined') {
      const botUsername = platformConfig.telegram.botUsername;
      if (botUsername) {
        window.location.href = `https://t.me/${botUsername}`;
        return;
      }

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }
    return;
  }

  base44.auth.redirectToLogin(redirectUrl);
}
