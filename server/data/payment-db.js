import { getPostgresSql } from './postgres.js';

const DATABASE_URL_KEYS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
];

const runtime = {
  sql: null,
  initialized: false,
};

function getDatabaseUrl() {
  for (const key of DATABASE_URL_KEYS) {
    const value = String(process.env[key] || '').trim();
    if (value) return value;
  }
  return '';
}

function getSql() {
  if (!runtime.sql) {
    runtime.sql = getPostgresSql();
  }
  return runtime.sql;
}

async function ensureSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      usd_price NUMERIC(12, 2) NOT NULL,
      ton_amount_locked TEXT NOT NULL,
      near_amount_locked TEXT NOT NULL,
      ton_amount_nano TEXT,
      near_amount_yocto TEXT,
      stars_amount_locked INTEGER NOT NULL,
      exchange_rate_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
      amount_paid TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      tx_hash TEXT UNIQUE,
      payment_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      completed_at TIMESTAMP
    )
  `;
  await sql`ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS ton_amount_nano TEXT`;
  await sql`ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS near_amount_yocto TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `;
}

function mapTransaction(row = {}) {
  return {
    id: row.id,
    user_id: row.user_id,
    item_id: row.item_id,
    payment_method: row.payment_method,
    usd_price: Number(row.usd_price || 0).toFixed(2),
    ton_amount_locked: String(row.ton_amount_locked || ''),
    near_amount_locked: String(row.near_amount_locked || ''),
    tonAmountNano: String(row.ton_amount_nano || ''),
    nearAmountYocto: String(row.near_amount_yocto || ''),
    stars_amount_locked: Number(row.stars_amount_locked || 0),
    exchange_rate_snapshot: row.exchange_rate_snapshot || {},
    amount_paid: row.amount_paid == null ? null : String(row.amount_paid),
    status: row.status,
    tx_hash: row.tx_hash || null,
    payment_payload: row.payment_payload || {},
    created_at: row.created_at,
    completed_at: row.completed_at,
  };
}

async function createTransaction(transaction) {
  const sql = getSql();
  const record = {
    ...transaction,
    payment_payload: transaction.payment_payload || {},
  };
  await sql`
    INSERT INTO payment_transactions (
      id, user_id, item_id, payment_method, usd_price, ton_amount_locked, near_amount_locked, ton_amount_nano, near_amount_yocto,
      stars_amount_locked, exchange_rate_snapshot, amount_paid, status, tx_hash, payment_payload,
      created_at, completed_at
    )
    VALUES (
      ${record.id}, ${record.user_id}, ${record.item_id}, ${record.payment_method}, ${record.usd_price},
      ${record.ton_amount_locked}, ${record.near_amount_locked}, ${record.tonAmountNano || null}, ${record.nearAmountYocto || null}, ${record.stars_amount_locked},
      ${JSON.stringify(record.exchange_rate_snapshot)}::jsonb, ${record.amount_paid},
      ${record.status}, ${record.tx_hash}, ${JSON.stringify(record.payment_payload)}::jsonb,
      ${record.created_at}::timestamp, ${record.completed_at ? `${record.completed_at}` : null}
    )
    ON CONFLICT (id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      item_id = EXCLUDED.item_id,
      payment_method = EXCLUDED.payment_method,
      usd_price = EXCLUDED.usd_price,
      ton_amount_locked = EXCLUDED.ton_amount_locked,
      near_amount_locked = EXCLUDED.near_amount_locked,
      ton_amount_nano = EXCLUDED.ton_amount_nano,
      near_amount_yocto = EXCLUDED.near_amount_yocto,
      stars_amount_locked = EXCLUDED.stars_amount_locked,
      exchange_rate_snapshot = EXCLUDED.exchange_rate_snapshot,
      amount_paid = EXCLUDED.amount_paid,
      status = EXCLUDED.status,
      tx_hash = EXCLUDED.tx_hash,
      payment_payload = EXCLUDED.payment_payload,
      completed_at = EXCLUDED.completed_at
  `;
  return transaction;
}

async function updateTransaction(id, patch = {}) {
  const sql = getSql();
  const rows = await sql`
    UPDATE payment_transactions
    SET
      user_id = COALESCE(${patch.user_id || null}, user_id),
      item_id = COALESCE(${patch.item_id || null}, item_id),
      payment_method = COALESCE(${patch.payment_method || null}, payment_method),
      usd_price = COALESCE(${patch.usd_price || null}, usd_price),
      ton_amount_locked = COALESCE(${patch.ton_amount_locked || null}, ton_amount_locked),
      near_amount_locked = COALESCE(${patch.near_amount_locked || null}, near_amount_locked),
      stars_amount_locked = COALESCE(${patch.stars_amount_locked || null}, stars_amount_locked),
      exchange_rate_snapshot = COALESCE(${patch.exchange_rate_snapshot ? JSON.stringify(patch.exchange_rate_snapshot) : null}::jsonb, exchange_rate_snapshot),
      amount_paid = COALESCE(${patch.amount_paid ?? null}, amount_paid),
      status = COALESCE(${patch.status || null}, status),
      tx_hash = COALESCE(${patch.tx_hash ?? null}, tx_hash),
      payment_payload = COALESCE(${patch.payment_payload ? JSON.stringify(patch.payment_payload) : null}::jsonb, payment_payload),
      completed_at = COALESCE(${patch.completed_at || null}::timestamp, completed_at)
    WHERE id = ${id}
    RETURNING *
  `;
  return mapTransaction(rows[0] || {});
}

async function claimPendingTransaction(id, patch = {}) {
  const sql = getSql();
  const rows = await sql`
    UPDATE payment_transactions
    SET status = 'success', amount_paid = ${patch.amount_paid || null},
        tx_hash = ${patch.tx_hash || null}, completed_at = ${patch.completed_at || new Date().toISOString()}::timestamp
    WHERE id = ${id} AND status = 'pending'
    RETURNING *
  `;
  return rows[0] ? mapTransaction(rows[0]) : null;
}

async function findTransactionById(id) {
  const sql = getSql();
  const rows = await sql`
    SELECT *
    FROM payment_transactions
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? mapTransaction(rows[0]) : null;
}

async function findTransactionByHash(txHash) {
  const sql = getSql();
  const rows = await sql`
    SELECT *
    FROM payment_transactions
    WHERE tx_hash = ${txHash}
    LIMIT 1
  `;
  return rows[0] ? mapTransaction(rows[0]) : null;
}

async function listPendingTransactions(limit = 100) {
  const sql = getSql();
  const rows = await sql`
    SELECT *
    FROM payment_transactions
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT ${limit}
  `;
  return rows.map(mapTransaction);
}

async function revenueSummary(days = 7) {
 const sql=getSql();
 const since=days===0?'1970-01-01T00:00:00.000Z':new Date(Date.now()-days*86400000).toISOString();
 const rows=await sql`SELECT payment_method, COUNT(*)::int AS count, COALESCE(SUM(NULLIF(amount_paid::text,'')::numeric),0)::text AS amount FROM payment_transactions WHERE status IN ('success','completed','succeeded','paid') AND COALESCE(completed_at,created_at)>=${since}::timestamptz GROUP BY payment_method`;
 return {days,since,rows};
}

async function listTransactions(limit = 100) {
  const sql = getSql();
  const safeLimit = Math.max(1, Math.min(500, Math.floor(Number(limit) || 100)));
  const rows = await sql`
    SELECT *
    FROM payment_transactions
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;
  return rows.map(mapTransaction);
}

async function listTransactionsByUser(userId, limit = 100) {
  const sql = getSql();
  const rows = await sql`
    SELECT *
    FROM payment_transactions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(mapTransaction);
}

async function appendEvent(event = {}) {
  const sql = getSql();
  const id = event.id || `payment-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await sql`
    INSERT INTO payment_events (id, transaction_id, event_type, payload, created_at)
    VALUES (
      ${id},
      ${event.transaction_id},
      ${event.type},
      ${JSON.stringify(event)}::jsonb,
      ${event.created_at || new Date().toISOString()}::timestamp
    )
  `;
  return id;
}

export const paymentDb = {
  async init() {
    if (runtime.initialized) return true;
    // Payments remain unavailable without a database, but they must not block
    // local gameplay endpoints such as fishing.
    if (!getDatabaseUrl()) {
      runtime.initialized = true;
      return false;
    }
    await ensureSchema();
    runtime.initialized = true;
    return true;
  },
  getSql,
  ensureSchema,
  createTransaction,
  updateTransaction,
  claimPendingTransaction,
  findTransactionById,
  findTransactionByHash,
  listPendingTransactions,
  listTransactions,
  revenueSummary,
  listTransactionsByUser,
  appendEvent,
};
