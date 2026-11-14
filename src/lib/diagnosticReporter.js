import { APP_VERSION } from '@/lib/appVersion';
import { platformConfig } from '@/lib/platform/config';
import { getTelegramSession } from '@/lib/platform/telegram';

let installed = false;
let sentCount = 0;
let windowStart = 0;

export function reportClientDiagnostic(kind, error, path = '') {
  if (typeof window === 'undefined' || !platformConfig.apiBaseUrl) return;
  const session = getTelegramSession();
  if (!session?.initData) return;
  const now = Date.now();
  if (now - windowStart >= 60000) { windowStart = now; sentCount = 0; }
  if (++sentCount > 10) return;

  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error || 'Unknown error');
  const endpoint = `${platformConfig.apiBaseUrl.replace(/\/+$/, '')}/diagnostics/client`;
  void fetch(endpoint, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': session.initData,
    },
    body: JSON.stringify({ kind, version: APP_VERSION, message, path: path || window.location.pathname }),
  }).catch(() => {});
}

export function installClientDiagnostics() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const onError = (event) => {
    const resourceUrl = event.target?.currentSrc || event.target?.src || event.target?.href;
    if (event.target !== window && resourceUrl) {
      try {
        reportClientDiagnostic('ASSET_ERROR', 'Resource failed to load', new URL(resourceUrl, window.location.href).pathname);
      } catch { /* Ignore malformed resource URLs. */ }
      return;
    }
    reportClientDiagnostic('JS_ERROR', event.error || event.message);
  };
  const onRejection = (event) => reportClientDiagnostic('UNHANDLED_REJECTION', event.reason);
  window.addEventListener('error', onError, true);
  window.addEventListener('unhandledrejection', onRejection);
}
