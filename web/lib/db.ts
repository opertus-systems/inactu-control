import { Pool } from "pg";

const globalForDb = globalThis as unknown as { dbPool?: Pool };

export function getDbPool(): Pool {
  if (globalForDb.dbPool) {
    return globalForDb.dbPool;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for auth flows.");
  }

  const pool = new Pool({
    connectionString: databaseUrl
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.dbPool = pool;
  }

  return pool;
}
