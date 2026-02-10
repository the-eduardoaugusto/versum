import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import fs from "fs";
import path from "path";

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

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
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
  },
});
