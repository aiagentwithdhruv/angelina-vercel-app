import { Pool } from 'pg';

// Postgres pool (Supabase/Vercel compatible; TLS via rejectUnauthorized: false for pooler)
declare global {
  // eslint-disable-next-line no-var
  var __angelinaPgPool: Pool | undefined;
}

function createPool(): Pool {
  const rawConnectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!rawConnectionString) {
    throw new Error('Postgres connection string missing. Set POSTGRES_URL or DATABASE_URL.');
  }

  try {
    const url = new URL(rawConnectionString);
    const sslDisabled = process.env.POSTGRES_SSL === 'disable';
    return new Pool({
      host: url.hostname,
      port: Number(url.port || 5432),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, '') || 'postgres',
      ssl: sslDisabled ? false : { rejectUnauthorized: false },
    });
  } catch {
    // Fallback for non-URL connection strings
    return new Pool({
      connectionString: rawConnectionString,
      ssl: process.env.POSTGRES_SSL === 'disable' ? false : { rejectUnauthorized: false },
    });
  }
}

export function getPgPool(): Pool {
  if (!global.__angelinaPgPool) {
    global.__angelinaPgPool = createPool();
  }
  return global.__angelinaPgPool;
}

