import pg from 'pg';

const { Pool } = pg;
let pool = null;

function getDatabaseUrl() {
  for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) {
    const value = String(process.env[key] || '').trim();
    if (value) return value;
  }
  return '';
}

export function getPostgresSql() {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) throw new Error('DATABASE_URL is required for PostgreSQL storage');
    pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 30000 });
  }

  return async (strings, ...values) => {
    let text = '';
    for (let index = 0; index < strings.length; index += 1) {
      text += strings[index];
      if (index < values.length) text += `$${index + 1}`;
    }
    const result = await pool.query(text, values);
    return result.rows;
  };
}

export async function closePostgres() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function withPostgresTransaction(action, options) {
 getPostgresSql();
 return runPostgresTransaction(pool, action, options);
}

export function getPostgresPoolStats() {
 return {total:pool?.totalCount || 0,idle:pool?.idleCount || 0,waiting:pool?.waitingCount || 0};
}

export async function runPostgresTransaction(transactionPool, action, {onTiming} = {}) {
 const mark=(name,start)=>onTiming?.(name,Date.now()-start);
 let start=Date.now();
 const client = await transactionPool.connect();
 mark('tx_pool',start);
 const sql = async (strings, ...values) => {
  let text = '';
  for (let i=0;i<strings.length;i++) { text += strings[i]; if(i<values.length) text += '$'+(i+1); }
  return (await client.query(text, values)).rows;
 };
 try {
  start=Date.now();await client.query('BEGIN');mark('tx_begin',start);
  const result = await action(sql);
  start=Date.now();await client.query('COMMIT');mark('tx_commit',start);
  return result;
 }
 catch(error) { await client.query('ROLLBACK').catch(()=>{}); throw error; }
 finally { client.release(); }
}
