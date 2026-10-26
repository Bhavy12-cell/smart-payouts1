import postgres from "postgres";

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL!, { max: 5, prepare: false });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;