import { AzuraClient } from "azurajs";
import { applyDecorators } from "azurajs/decorators";
import * as controllers from "@/controllers";
import {
  cachePublicRoutes,
  debugRequests,
  publicRoutesRateLimit,
} from "@/middlewares";
import { env } from "@/env";
import { setupSwaggerWithControllers } from "azurajs/swagger";
import { redis } from "@/libs/redis";
import { logger } from "azurajs/logger";
import { prisma } from "@/libs/prisma";

const app = new AzuraClient();
const appUrl = env.APP_URL || `http://localhost:${env.PORT}`;

applyDecorators(app, Object.values(controllers));

setupSwaggerWithControllers(
  app,
  {
    title: "Versum API",
    description: "Versum é a sua bíblia online!",
    version: "1",
    servers: [
      {
        url: appUrl,
      },
    ],
  },
  Object.values(controllers),
);

app.use(debugRequests);
app.use(publicRoutesRateLimit);
app.use(cachePublicRoutes);

app.listen(Number(env.PORT)).then(async () => {
  redis.on("connecting", () => {
    logger("log", "Connecting to Redis Database! 🔴", {
      colors: {
        log: "#336791",
      },
      timestampFormat: "time",
      showTimestamp: true,
    });
  });
  redis.on("connect", () => {
    logger("success", "   Connected on Redis Database! 🔴", {
      timestampFormat: "time",
      showTimestamp: true,
    });
  });

  try {
    logger("log", "Connecting to Postgre Database! 🐘", {
      colors: {
        log: "#336791",
      },
      timestampFormat: "time",
      showTimestamp: true,
    });

    await prisma.$connect();

    logger("success", "   Connected on Postgre Database! 🐘", {
      timestampFormat: "time",
      showTimestamp: true,
    });
  } catch (e) {
    logger("fatal", ` Error on try connect a Postgre Database! 🐘.\n${e}`, {
      timestampFormat: "time",
      showTimestamp: true,
    });
  }
});
