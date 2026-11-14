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
