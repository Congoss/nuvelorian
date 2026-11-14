import { platformConfig } from '@/lib/platform/config';

const MOCK_TELEGRAM_USER = {
  id: 777000,
  is_bot: false,
  first_name: 'Local',
  last_name: 'Tester',
  username: 'local_tester',
  language_code: 'uk',
};

function getMockTelegramUser() {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return MOCK_TELEGRAM_USER;

  const params = new URLSearchParams(window.location.search);
  const rawId = params.get('mockUserId');
  const id = Number(rawId);
  const startParam = params.get('startapp') || params.get('start_param') || '';
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { ...MOCK_TELEGRAM_USER, start_param: startParam };
  }

  return {
    ...MOCK_TELEGRAM_USER,
    id,
    first_name: 'Test',
    last_name: `Player ${id}`,
    username: `test_player_${id}`,
    start_param: startParam,
  };
}

function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

function px(value) {
  const num = Number(value);
  return Number.isFinite(num) ? `${num}px` : '0px';
}

function getFullscreenTopReserve(webApp) {
  // Telegram reports the space occupied by its controls independently of system insets.
  if (Number(webApp?.contentSafeAreaInset?.top) > 0) {
    const mobile = /android|ios|iphone|ipad/.test(String(webApp?.platform || '').toLowerCase());
    return mobile && webApp?.isFullscreen ? 'calc(48px + var(--tg-safe-area-inset-top, 0px))' : '0px';
  }
  const platform = String(webApp?.platform || '').toLowerCase();
  const isFullscreen = Boolean(webApp?.isFullscreen);

  if (platform.includes('android')) {
    return isFullscreen ? 'clamp(72px, 10vh, 112px)' : 'clamp(50px, 7vh, 72px)';
  }
  if (
    platform.includes('ios') ||
    platform.includes('iphone') ||
    platform.includes('ipad') ||
    platform.includes('mac')
  ) {
    return isFullscreen ? 'clamp(72px, 10vh, 112px)' : 'clamp(50px, 7vh, 72px)';
  }
  return isFullscreen ? 'clamp(56px, 8vh, 96px)' : '0px';
}

function applyTelegramCssVars(webApp) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const viewportHeight = Number(webApp?.viewportHeight || 0);
  const viewportStableHeight = Number(webApp?.viewportStableHeight || viewportHeight || 0);
  const safeArea = webApp?.safeAreaInset || {};
  const contentSafeArea = webApp?.contentSafeAreaInset || {};

  root.style.setProperty('--tg-viewport-height', viewportHeight > 0 ? `${viewportHeight}px` : `${window.innerHeight}px`);
  root.style.setProperty('--tg-viewport-stable-height', viewportStableHeight > 0 ? `${viewportStableHeight}px` : `${window.innerHeight}px`);
  root.style.setProperty('--tg-safe-area-inset-top', px(safeArea.top));
  root.style.setProperty('--tg-safe-area-inset-bottom', px(safeArea.bottom));
  root.style.setProperty('--tg-content-safe-area-inset-top', px(contentSafeArea.top));
  root.style.setProperty('--tg-content-safe-area-inset-bottom', px(contentSafeArea.bottom));
  root.style.setProperty('--app-telegram-controls-top', getFullscreenTopReserve(webApp));
  const computed = window.getComputedStyle(root);
  console.info('[tg-layout]', {
    platform: webApp?.platform || null,
    version: webApp?.version || null,
    isFullscreen: Boolean(webApp?.isFullscreen),
    viewportHeight,
    viewportStableHeight,
    safeTop: Number(safeArea.top || 0),
    safeBottom: Number(safeArea.bottom || 0),
    contentSafeTop: Number(contentSafeArea.top || 0),
    contentSafeBottom: Number(contentSafeArea.bottom || 0),
    appSafeTop: computed.getPropertyValue('--app-safe-top').trim(),
    appTelegramControlsTop: computed.getPropertyValue('--app-telegram-controls-top').trim(),
    appTopOffset: computed.getPropertyValue('--app-top-offset').trim(),
    appSafeBottom: computed.getPropertyValue('--app-safe-bottom').trim(),
  });
}

function buildTelegramSessionFromUser(telegramUser, source = 'telegram') {
  if (!telegramUser?.id) return null;

  const username = telegramUser.username || `tg_${telegramUser.id}`;
  const fullName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ').trim();
  const photoUrl = String(telegramUser.photo_url || telegramUser.photoUrl || '').trim();

  return {
    id: `telegram:${telegramUser.id}`,
    provider: 'telegram',
    source,
    telegramId: telegramUser.id,
    username,
    full_name: fullName || username,
    first_name: telegramUser.first_name || '',
    last_name: telegramUser.last_name || '',
    email: `telegram_${telegramUser.id}@miniapp.local`,
    avatar: photoUrl || '',
    photoUrl,
    role: 'player',
    telegramUser,
    initData: source === 'telegram' ? getTelegramWebApp()?.initData || '' : '',
    initDataUnsafe: source === 'telegram' ? getTelegramWebApp()?.initDataUnsafe || null : null,
    startParam: telegramUser.start_param || telegramUser.startParam || '',
  };
}

export function initializeTelegramMiniApp() {
  const webApp = getTelegramWebApp();

  if (!webApp) return null;

  try {
    webApp.ready();
    webApp.expand();
    // CSS overscroll only controls the page, not Telegram's native sheet.
    if (webApp.isVersionAtLeast?.('7.7')) {
      webApp.disableVerticalSwipes?.();
    }
    if (webApp.isVersionAtLeast?.('8.0') && typeof webApp.requestFullscreen === 'function') {
      webApp.requestFullscreen();
    }
    webApp.setHeaderColor?.('#0d0a07');
    webApp.setBackgroundColor?.('#0d0a07');
    webApp.enableClosingConfirmation?.();
    applyTelegramCssVars(webApp);
    const syncLayout = () => applyTelegramCssVars(webApp);
    webApp.onEvent?.('viewportChanged', syncLayout);
    webApp.onEvent?.('safeAreaChanged', syncLayout);
    webApp.onEvent?.('contentSafeAreaChanged', syncLayout);
    webApp.onEvent?.('fullscreenChanged', syncLayout);
    webApp.onEvent?.('fullscreenFailed', syncLayout);
    webApp.onEvent?.('activated', syncLayout);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', syncLayout);
    }
  } catch (error) {
    console.warn('Telegram WebApp initialization warning:', error);
  }

  return webApp;
}

export function getTelegramSession() {
  const webApp = getTelegramWebApp();

  if (webApp?.initDataUnsafe?.user) {
    return buildTelegramSessionFromUser({
      ...webApp.initDataUnsafe.user,
      start_param: webApp.initDataUnsafe.start_param || '',
    }, 'telegram');
  }

  if (platformConfig.platform === 'web') {
    // The server authenticates the HttpOnly cookie; no browser-supplied ID.
    return { id: 'web-session', provider: 'telegram', source: 'web', initData: '' };
  }

  if (import.meta.env.DEV && platformConfig.telegram.useMock && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) && !webApp?.initData) {
    return buildTelegramSessionFromUser(getMockTelegramUser(), 'mock');
  }

  return null;
}

export function isTelegramWebAppAvailable() {
  return Boolean(getTelegramWebApp());
}
