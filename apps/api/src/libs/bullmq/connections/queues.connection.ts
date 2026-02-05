import { env } from "@/env";
import { CustomRedisClient } from "@/libs/redis";

export const queuesRedisConnection = new CustomRedisClient(
  env.REDIS_DATABASE_URL,
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  },
);
