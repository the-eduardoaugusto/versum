import { logger } from "@versum/logger";
import { RedisClient } from "bun";
import { env } from "../../utils/env/index.ts";



function createRedisClient() {
  const url = env.REDIS_DATABASE_URL;
  const client = new RedisClient(url, {
    maxRetries: 1,
  });

  let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  const stopKeepAlive = () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  };

  const startKeepAlive = () => {
    stopKeepAlive();
    keepAliveInterval = setInterval(async () => {
      try {
        await client.ping();
      } catch (error) {
        logger(
          { level: "warn" },
          "[REDIS]",
          `Keep-alive ping failed: ${error instanceof Error ? error.message : error}`,
        );
      }
    }, 10000);
  };

  client.onconnect = () => {
    logger("success", "[REDIS]", "Connection established");
    startKeepAlive();
  };

  client.onclose = (error) => {
    stopKeepAlive();
    logger(
      { level: "error" },
      "[REDIS]",
      `Connection failed: ${error?.message ?? error}. Reconnecting in 5s...`,
    );

    setTimeout(() => {
      logger({ level: "info" }, "[REDIS]", "Reconnecting...");
      client.connect().catch((err) => {
        logger({ level: "error" }, "[REDIS]", `Reconnect failed: ${err}`);
      });
    }, 5000);
  };

  return client;
}

export const redis = createRedisClient();
