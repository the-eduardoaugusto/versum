import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../../utils/env/index.ts";
import * as schema from "./schema.ts";

let ca: string | undefined;
try {
  const text = await Bun.file(".certs/postgre-certificate.pem").text();
  if (text.trim()) ca = text;
} catch {
  ca = undefined;
}

const dbUrl = new URL(env.DATABASE_URL);

const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port, 10),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace("/", ""),
  ssl: {
    ca,
    cert: ca,
    key: ca,
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pgPool, {
  schema,
  logger: env.BUN_ENV === "development",
});
