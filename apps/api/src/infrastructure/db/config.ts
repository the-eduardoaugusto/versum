import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../../utils/env/index.ts";
import * as schema from "./schema.ts";

const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 30,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pgPool, {
  schema,
  logger: env.BUN_ENV === "development",
});
