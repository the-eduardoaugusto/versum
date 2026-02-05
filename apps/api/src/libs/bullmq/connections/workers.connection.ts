import { env } from "@/env";
import { CustomRedisClient } from "@/libs/redis";

export const workersRedisConnection = new CustomRedisClient(
  env.REDIS_DATABASE_URL,
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  },
);
