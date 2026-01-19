import { Redis } from "ioredis";
import { env } from "@/env";
import path from "path";
import { readFileSync } from "fs";

const certPath = path.join(process.cwd(), env.REDIS_DATABASE_CERT_PATH);
const cert = readFileSync(certPath, "utf-8");

export const redis = new Redis(env.REDIS_DATABASE_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  tls: {
    key: cert,
    cert,
    ca: cert,
    rejectUnauthorized: false,
  },
});
