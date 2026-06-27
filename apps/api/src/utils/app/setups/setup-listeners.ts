import type { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "@versum/logger";
import { redis } from "../../../infrastructure/redis";
import { ErrorHandler } from "../errors/index.ts";

export class SetupListeners {
  private readonly app: OpenAPIHono;

  constructor({ app }: { app: OpenAPIHono }) {
    this.app = app;
    this.setupErrorListener();
    this.setupRedisListener();
  }

  private setupRedisListener() {
    redis.connect().catch((err) => {
      logger({ level: "error" }, "[REDIS]", `Connection failed: ${err}`);
    });
  }

  private setupErrorListener() {
    this.app.onError((error, ctx) => {
      logger(
        {
          level: "error",
        },
        `Server error: ${error.message}`,
        error.cause ? `Caused by: ${error.cause}` : "",
      );

      return new ErrorHandler({ ctx }).handle(error);
    });
  }
}
