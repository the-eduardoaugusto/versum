import { defineConfig } from "drizzle-kit";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const certPath = resolve(process.cwd(), ".certs/postgre-certificate.pem");
const ca = existsSync(certPath) ? readFileSync(certPath, "utf-8") : undefined;

const dbUrl = new URL(process.env.DATABASE_URL!);

export default defineConfig({
  out: "./drizzle",
  schema: "./src/infrastructure/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace("/", ""),
    ssl: {
      ca,
      rejectUnauthorized: false,
    },
  },
});
