import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/env";
import path from "path";
import fs from "fs";
import { Pool } from "pg";
import * as schema from "../../db/schema";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const isTest = process.env.NODE_ENV === "test";

const readCert = (filename: string) => {
  if (isTest) return undefined;
  const fullPath = path.join(process.cwd(), filename);
  return fs.existsSync(fullPath)
    ? fs.readFileSync(fullPath, "utf-8")
    : undefined;
};

const ca = readCert(".certs/postgre-ca.crt");
const cert = readCert(".certs/postgre-certificate.pem");
const key = readCert(".certs/postgre-private-key.key");

const dbUrl = new URL(process.env.DATABASE_URL!);

const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace("/", ""),
  ssl: {
    ca,
    cert,
    key,
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pgPool, {
  schema,
  logger: true,
});
