import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../../utils/env/index.ts";
import * as schema from "./schema.ts";

const cert = await Bun.file(".certs/postgre-certificate.pem").text();

const dbUrl = new URL(env.DATABASE_URL);

const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port, 10),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace("/", ""),
  ssl: {
    cert,
    ca: cert,
    key: cert,
    rejectUnauthorized: true,
  },
});

export const db = drizzle(pgPool, {
  schema,
  logger: env.BUN_ENV === "development",
});
