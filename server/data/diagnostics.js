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

function safeMessage(value) {
  const text = String(value || '');
  if (/\b(?:auth_date|query_id|tgWebAppData)=/i.test(text)) return '[Telegram session redacted]';
  return text
    .replace(/https?:\/\/[^\s)]+/gi, '[url]')
    .replace(/\b(?:token|password|secret|init_?data|authorization)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '[redacted]')
    .replace(/\b(?:Bearer\s+)?[A-Za-z0-9_=-]{32,}\b/g, '[redacted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/\b\d{7,}\b/g, '[id]')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, 300);
}

function allowEvent(event) {
  const now = Date.now();
  const key = `${event.source}:${event.path}:${event.status}:${event.code}`;
  const bucket = rateBuckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start >= 60000) { bucket.start = now; bucket.count = 0; }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (rateBuckets.size > 1000) {
    for (const [entryKey, entry] of rateBuckets) if (now - entry.start > 120000) rateBuckets.delete(entryKey);
  }
  return bucket.count <= 20;
}

function normalizeEvent(event = {}) {
  return {
    source: event.source === 'client' ? 'client' : 'api',
    method: /^[A-Z]{2,8}$/.test(String(event.method || '')) ? event.method : '',
    path: safePath(event.path),
    status: Math.max(0, Math.min(599, Math.floor(Number(event.status) || 0))),
    code: /^[A-Z0-9_]{1,80}$/.test(String(event.code || '')) ? event.code : 'UNKNOWN',
    duration_ms: Math.max(0, Math.min(600000, Math.floor(Number(event.duration_ms) || 0))),
    message: safeMessage(event.source === 'client' ? event.message : `[server ${APP_VERSION}] ${event.message || ''}`),
  };
}

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
  memoryEvents.length = Math.min(memoryEvents.length, MAX_EVENTS);
  if (!hasDatabase()) {
    return;
  }
  await ensureSchema();
  const sql = getPostgresSql();
  await sql`
    INSERT INTO diagnostic_events (source, method, path, status, code, duration_ms, message)
    VALUES (${normalized.source}, ${normalized.method}, ${normalized.path}, ${normalized.status}, ${normalized.code}, ${normalized.duration_ms}, ${normalized.message})
  `;
  writeCount += 1;
  if (writeCount % 50 === 0) {
    await sql`
      DELETE FROM diagnostic_events
      WHERE created_at < now() - interval '14 days'
         OR id NOT IN (SELECT id FROM diagnostic_events ORDER BY id DESC LIMIT ${MAX_EVENTS})
    `;
  }
}

export async function listDiagnosticEvents(limit = 200) {
  const safeLimit = Math.max(1, Math.min(500, Math.floor(Number(limit) || 200)));
  if (!hasDatabase()) return memoryEvents.slice(0, safeLimit);
  try {
    await ensureSchema();
    const sql = getPostgresSql();
    return await sql`
      SELECT id, created_at, source, method, path, status, code, duration_ms, message
      FROM diagnostic_events
      WHERE created_at >= now() - interval '14 days'
      ORDER BY id DESC
      LIMIT ${safeLimit}
    `;
  } catch {
    return memoryEvents.slice(0, safeLimit);
  }
}
