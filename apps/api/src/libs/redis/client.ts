import { existsSync, readFileSync } from "fs";
import Redis, { RedisOptions } from "ioredis";
import path from "path";
import { env } from "@/env";

export class CustomRedisClient extends Redis {
  constructor(connectionUri: string, options: RedisOptions) {
    super(connectionUri, getCustomRedisClientOptions(options));
  }
}

function getCustomRedisClientOptions(options: RedisOptions): RedisOptions {
  if (!env.REDIS_DATABASE_CERT_PATH || options.tls) return options;
  const certPath = path.join(process.cwd(), env.REDIS_DATABASE_CERT_PATH);
  if (!existsSync(certPath)) return options;
  const cert = readFileSync(certPath, "utf-8");
  return {
    ...options,
    tls: {
      key: cert,
      cert,
      ca: cert,
      rejectUnauthorized: false,
    },
  };
}
