import { APP_VERSION } from '../../src/lib/appVersion.js';
import { getPostgresSql } from './postgres.js';

const MAX_EVENTS = 2000;
const memoryEvents = [];
const rateBuckets = new Map();
let schemaPromise = null;
let writeCount = 0;

function hasDatabase() {
  return ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']
    .some((key) => Boolean(String(process.env[key] || '').trim()));
}

function safePath(value) {
  let path = String(value || '/').split(/[?#]/, 1)[0];
  if (!path.startsWith('/')) path = '/';
  return path
    .replace(/\/(players|boss-fights|attack-logs|payments|promo-codes|referrals)\/[^/]+/gi, '/$1/:id')
    .replace(/\/[0-9]{7,}(?=\/|$)/g, '/:id')
    .replace(/\/[A-Za-z0-9_-]{40,}(?=\/|$)/g, '/:id')
    .slice(0, 180);
}

export function safeMessage(value,limit=300) {
  const text = String(value || '');
  if (/\b(?:auth_date|query_id|tgWebAppData)=/i.test(text)) return '[Telegram session redacted]';
  return text
    .replace(/https?:\/\/[^\s)]+/gi, '[url]')
    .replace(/\b(?:token|password|secret|init_?data|authorization)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '[redacted]')
    .replace(/\b(?:Bearer\s+)?[A-Za-z0-9_=-]{32,}\b/g, '[redacted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/\b\d{7,}\b/g, '[id]')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, limit);
}

function allowEvent(event) {
  const now = Date.now();
  const key = `${event.player_id}:${event.source}:${event.path}:${event.status}:${event.code}`;
  const bucket = rateBuckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start >= 60000) { bucket.start = now; bucket.count = 0; }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (rateBuckets.size > 1000) {
    for (const [entryKey, entry] of rateBuckets) if (now - entry.start > 120000) rateBuckets.delete(entryKey);
  }
  return bucket.count <= 20;
}

export function normalizeEvent(event = {}) {
  return {
    source: event.source === 'client' ? 'client' : 'api',
    player_id: String(event.player_id || '').replace(/[^a-zA-Z0-9_:@.-]/g, '').slice(0,100),
    details: sanitizePerformanceDetails(event.details),
    method: /^[A-Z]{2,8}$/.test(String(event.method || '')) ? event.method : '',
    path: safePath(event.path),
    status: Math.max(0, Math.min(599, Math.floor(Number(event.status) || 0))),
    code: /^[A-Z0-9_]{1,80}$/.test(String(event.code || '')) ? event.code : 'UNKNOWN',
    duration_ms: Math.max(0, Math.min(600000, Math.floor(Number(event.duration_ms) || 0))),
    message: safeMessage(event.source === 'client' ? event.message : `[server ${APP_VERSION}] ${event.message || ''}`,1000),
  };
}

const DETAIL_KEYS = new Set('db_pool_total db_pool_idle db_pool_waiting player_name player_db_id request_count request_p95_ms request_max_ms request_errors navigation_ttfb_ms navigation_load_ms resource_count resource_slow_count resource_transfer_bytes slow_resource_path slow_resource_ms session_id request_id screen version user_agent platform cores device_memory_gb viewport_width viewport_height pixel_ratio connection_type downlink_mbps rtt_ms save_data online heap_used_mb heap_limit_mb dom_nodes sample_fps frame_p95_ms long_frames long_tasks blocked_ms worst_task_ms event_loop_lag_ms elapsed_ms fetch_ms parse_ms transfer_bytes decoded_bytes dns_ms connect_ms ttfb_ms download_ms method server_timing http_timing server_rss_mb server_heap_mb server_uptime_s server_event_loop_utilization'.split(' '));
export function sanitizePerformanceDetails(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result = {};
  for (const [key,item] of Object.entries(value)) {
    if (!DETAIL_KEYS.has(key)) continue;
    if (typeof item === 'number' && Number.isFinite(item)) result[key] = Math.max(0,Math.min(1e9,item));
    else if (typeof item === 'boolean') result[key] = item;
    else if (['session_id','request_id'].includes(key) && /^[a-zA-Z0-9-]{1,80}$/.test(item)) result[key] = item;
    else if (typeof item === 'string') result[key] = safeMessage(item,['server_timing','http_timing'].includes(key)?1000:300);
  }
  return result;
}
const PERFORMANCE_CODES = ['UI_STALL','SLOW_API','PERFORMANCE_SAMPLE','SLOW_REQUEST'];

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getPostgresSql();
      await sql`
        CREATE TABLE IF NOT EXISTS diagnostic_events (
          id BIGSERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          source TEXT NOT NULL,
          method TEXT NOT NULL DEFAULT '',
          path TEXT NOT NULL,
          status INT NOT NULL DEFAULT 0,
          code TEXT NOT NULL,
          duration_ms INT NOT NULL DEFAULT 0,
          message TEXT NOT NULL DEFAULT ''
        )
      `;
      await sql`ALTER TABLE diagnostic_events ADD COLUMN IF NOT EXISTS player_id TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb`;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function recordDiagnosticEvent(event) {
  const normalized = normalizeEvent(event);
  if (!allowEvent(normalized)) return;
  memoryEvents.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, created_at: new Date().toISOString(), ...normalized });
  // Keep a separate budget so performance samples cannot evict error reports.
  const counts = [0,0];
  for (let i=0;i<memoryEvents.length;) {
    const group=PERFORMANCE_CODES.includes(memoryEvents[i].code)?1:0;
    if (++counts[group]>MAX_EVENTS) memoryEvents.splice(i,1); else i++;
  }
  if (!hasDatabase()) {
    return;
  }
  await ensureSchema();
  const sql = getPostgresSql();
  await sql`
    INSERT INTO diagnostic_events (source, method, path, status, code, duration_ms, message, player_id, details)
    VALUES (${normalized.source}, ${normalized.method}, ${normalized.path}, ${normalized.status}, ${normalized.code}, ${normalized.duration_ms}, ${normalized.message}, ${normalized.player_id}, ${JSON.stringify(normalized.details)}::jsonb)
  `;
  writeCount += 1;
  if (writeCount % 50 === 0) {
    await sql`
      DELETE FROM diagnostic_events
      WHERE created_at < now() - interval '14 days'
         OR id NOT IN (
           (SELECT id FROM diagnostic_events WHERE code = ANY(${PERFORMANCE_CODES}::text[]) ORDER BY id DESC LIMIT ${MAX_EVENTS})
           UNION ALL
           (SELECT id FROM diagnostic_events WHERE NOT (code = ANY(${PERFORMANCE_CODES}::text[])) ORDER BY id DESC LIMIT ${MAX_EVENTS})
         )
    `;
  }
}

export async function listDiagnosticEvents(limit = 200, performanceOnly = false, filters = {}) {
  const safeLimit = Math.max(1, Math.min(performanceOnly ? 2000 : 500, Math.floor(Number(limit) || 200)));
  const query = String(filters.q || '').slice(0,100).toLowerCase();
  const source = ['api','client'].includes(filters.source) ? filters.source : '';
  const since = Number.isFinite(Date.parse(filters.since)) ? new Date(filters.since).toISOString() : new Date(Date.now()-14*86400000).toISOString();
  const match = e => (!source || e.source===source) && e.created_at>=since && (!query || `${e.player_id} ${e.details?.player_name || ''} ${e.details?.player_db_id || ''} ${e.path} ${e.code} ${e.details?.request_id || ''} ${e.details?.session_id || ''}`.toLowerCase().includes(query));
  if (!hasDatabase()) return memoryEvents.filter(match).filter(e=>performanceOnly ? PERFORMANCE_CODES.includes(e.code) : !PERFORMANCE_CODES.includes(e.code)).slice(0, safeLimit);
  try {
    await ensureSchema();
    const sql = getPostgresSql();
    return await sql`
      SELECT id, created_at, source, method, path, status, code, duration_ms, message, player_id, details
      FROM diagnostic_events
      WHERE created_at >= now() - interval '14 days' AND created_at >= ${since}::timestamptz
        AND (${source} = '' OR source = ${source})
        AND (${query} = '' OR position(${query} in lower(player_id || ' ' || coalesce(details->>'player_name','') || ' ' || coalesce(details->>'player_db_id','') || ' ' || path || ' ' || code || ' ' || coalesce(details->>'request_id','') || ' ' || coalesce(details->>'session_id',''))) > 0)
        AND (CASE WHEN ${performanceOnly} THEN code = ANY(${PERFORMANCE_CODES}::text[]) ELSE NOT (code = ANY(${PERFORMANCE_CODES}::text[])) END)
      ORDER BY id DESC
      LIMIT ${safeLimit}
    `;
  } catch {
    return memoryEvents.filter(match).filter(e=>performanceOnly ? PERFORMANCE_CODES.includes(e.code) : !PERFORMANCE_CODES.includes(e.code)).slice(0, safeLimit);
  }
}
