import {diagnosticResourceUrl} from './diagnosticResourceUrl';
import {installPerformanceDiagnostics} from './performanceDiagnostics.js';
import { APP_VERSION } from '@/lib/appVersion';
import { platformConfig } from '@/lib/platform/config';
import { getTelegramSession } from '@/lib/platform/telegram';

let installed = false;
const diagnosticSessionId = globalThis.crypto?.randomUUID?.() || `session-${Date.now().toString(36)}`;
export function getDiagnosticContext() {
  const n = navigator, c = n.connection, memory = performance.memory;
  const navigation=performance.getEntriesByType('navigation')[0];
  const resources=performance.getEntriesByType('resource');
  const slowest=resources.reduce((max,r)=>r.duration>(max?.duration || 0)?r:max,null);
  let slowPath=''; try { if(slowest)slowPath=new URL(slowest.name).pathname; } catch {}
  return {navigation_ttfb_ms:navigation?.responseStart, navigation_load_ms:navigation?.loadEventEnd,resource_count:resources.length,resource_slow_count:resources.filter(r=>r.duration>=2000).length,resource_transfer_bytes:resources.reduce((sum,r)=>sum+(r.transferSize || 0),0),slow_resource_path:slowPath,slow_resource_ms:slowest?.duration,session_id:diagnosticSessionId,version:APP_VERSION,build_id:__GAME_BUILD_ID__,screen:document.querySelector('.ship-battle-screen')?.dataset.screen || document.querySelector('.game-app[data-screen]')?.dataset.screen || '',user_agent:n.userAgent,platform:n.platform,cores:n.hardwareConcurrency,device_memory_gb:n.deviceMemory,viewport_width:innerWidth,viewport_height:innerHeight,pixel_ratio:devicePixelRatio,connection_type:c?.effectiveType,downlink_mbps:c?.downlink,rtt_ms:c?.rtt,save_data:c?.saveData,online:n.onLine,heap_used_mb:memory?.usedJSHeapSize/1048576,heap_limit_mb:memory?.jsHeapSizeLimit/1048576};
}
let sentCount = 0;
let windowStart = 0;

export function reportClientDiagnostic(kind, error, path = '', details = {}) {
  if (typeof window === 'undefined' || !platformConfig.apiBaseUrl) return;
  try {
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
    body: JSON.stringify({ kind, version: APP_VERSION, message, path: path || window.location.pathname, duration_ms:details.elapsed_ms || 0, details:{...getDiagnosticContext(),...details} }),
  }).catch(() => {});
  } catch { /* Telemetry must never interrupt a player action. */ }
}

export function installClientDiagnostics() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  try { installPerformanceDiagnostics({ scope: window, report: reportClientDiagnostic }); } catch { /* Diagnostics must never interrupt gameplay. */ }
  const onError = (event) => {
    const resourceUrl = diagnosticResourceUrl(event.target);
    if (event.target !== window && resourceUrl) {
      try {
        const resource=new URL(resourceUrl, window.location.href);
        reportClientDiagnostic('ASSET_ERROR', `Resource failed to load (${resource.origin})`, resource.pathname);
      } catch { /* Ignore malformed resource URLs. */ }
      return;
    }
    let path=window.location.pathname;
    if(event.filename){try{path=`${new URL(event.filename,window.location.href).pathname}:${event.lineno||0}:${event.colno||0}`;}catch{}}
    reportClientDiagnostic('JS_ERROR', event.error || (event.message==='Script error.' ? 'Opaque cross-origin script error: browser withheld filename and stack' : event.message), path);
  };
  const onRejection = (event) => reportClientDiagnostic('UNHANDLED_REJECTION', event.reason);
  window.addEventListener('error', onError, true);
  window.addEventListener('unhandledrejection', onRejection);
}
