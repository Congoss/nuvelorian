let activeWrites = 0;
let closeGuardTimer = 0;

// Ask before closing only while a save is actually in flight, instead of on
// every close of the mini app.
function syncCloseGuard() {
  const webApp = globalThis.window?.Telegram?.WebApp;
  if (!webApp?.isVersionAtLeast?.('6.2')) return;
  clearTimeout(closeGuardTimer);
  if (activeWrites > 0) webApp.enableClosingConfirmation?.();
  else closeGuardTimer = setTimeout(() => { if (!activeWrites) webApp.disableClosingConfirmation?.(); }, 400);
}

export async function trackGameWrite(work) {
  activeWrites++;
  if (activeWrites === 1) syncCloseGuard();
  try {
    return await work();
  } finally {
    activeWrites--;
    if (!activeWrites) syncCloseGuard();
  }
}

const RELOAD_KEY = 'p4-build-reload';
function alreadyTried(buildId) {
  try { return sessionStorage.getItem(RELOAD_KEY) === String(buildId); } catch { return false; }
}
function reloadForBuild(buildId) {
  try { sessionStorage.setItem(RELOAD_KEY, String(buildId)); } catch { /* reload once without memory */ }
  const url = new URL(window.location.href);
  // A new query string bypasses a cached index.html; the hash keeps Telegram launch data.
  url.searchParams.set('build', String(buildId).slice(0, 12));
  window.location.replace(url.toString());
}

export function watchGameBuild() {
  if (!import.meta.env.PROD) return;
  let stopped = false;
  let checking = false;
  let updateAvailable = false;
  let latestBuildId = null;
  let lastInteraction = Date.now();
  const markInteraction = () => { lastInteraction = Date.now(); };
  const check = async () => {
    if (stopped || checking || document.hidden) return;
    checking = true;
    try {
      if (!updateAvailable) {
        const response = await fetch('/release-version.json', { cache: 'no-store' });
        if (!response.ok) return;
        const { buildId } = await response.json();
        latestBuildId = buildId;
        // A WebView that keeps serving an old bundle would otherwise reload
        // forever. Try each new build at most once per session.
        updateAvailable = Boolean(buildId && buildId !== __GAME_BUILD_ID__ && !alreadyTried(buildId));
      }
      if (!stopped && !document.hidden && updateAvailable && !activeWrites && Date.now() - lastInteraction >= 5000) {
        reloadForBuild(latestBuildId);
      }
    } catch {
      // Retry when the connection returns.
    } finally {
      checking = false;
    }
  };
  const timer = window.setInterval(check, 15000);
  document.addEventListener('visibilitychange', check);
  window.addEventListener('pointerdown', markInteraction, true);
  window.addEventListener('keydown', markInteraction, true);
  void check();
  return () => {
    stopped = true;
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', check);
    window.removeEventListener('pointerdown', markInteraction, true);
    window.removeEventListener('keydown', markInteraction, true);
  };
}
