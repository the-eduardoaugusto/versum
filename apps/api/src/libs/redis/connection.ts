import { env } from "@/env";
import { CustomRedisClient } from "./client";

export const redis = new CustomRedisClient(env.REDIS_DATABASE_URL, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});
