import { AzuraClient } from "azurajs";
import { applyDecorators } from "azurajs/decorators";
import { setupSwaggerWithControllers } from "azurajs/swagger";
import { logger } from "azurajs/logger";
import { env } from "@/env";
import { redis } from "@/libs/redis";
import { prisma } from "@/libs/prisma";
import { Scalar } from "azurajs-scalar";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Classe responsável pelo startup e configuração inicial da aplicação
 */
export class ApplicationStartup {
  private app: AzuraClient;
  private controllers: any[];

  constructor(app: AzuraClient, controllers: any[]) {
    this.app = app;
    this.controllers = controllers;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const baseUrl = env.APP_URL || "http://localhost:4002";
    new Scalar({
      apiSpecPath: "/api-spec.json",
      proxyPath: "/scalar/proxy/",
      docPath: "/docs/",
      customHtmlPath: path.join(__dirname, "./public/html/api-docs.html"),
      app,
      baseUrl,
    });
  }

  /**
   * Registra os decoradores dos controllers na aplicação
   */
  private registerDecorators(): void {
    applyDecorators(this.app, Object.values(this.controllers));
  }

  /**
   * Configura o Swagger da aplicação
   */
  private setupSwagger(): void {
    const appUrl = env.APP_URL || `http://localhost:${env.PORT}`;

    setupSwaggerWithControllers(
      this.app,
      {
        title: "Versum API",
        description: "Versum é a sua bíblia online!",
        version: "1",
        servers: [
          {
            url: appUrl,
          },
        ],
        uiEnabled: false,
      },
      Object.values(this.controllers),
    );
  }

  /**
   * Registra os middlewares da aplicação
   */
  private registerMiddlewares(middlewares: any[]): void {
    middlewares.forEach((middleware) => {
      this.app.use(middleware);
    });
  }

  /**
   * Conecta ao Redis
   */
  private async connectRedis(): Promise<void> {
    return new Promise((resolve) => {
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
        resolve();
      });

      redis.on("error", (error) => {
        logger("fatal", ` Error connecting to Redis Database! 🔴.\n${error}`, {
          timestampFormat: "time",
          showTimestamp: true,
        });
        resolve();
      });
    });
  }

  /**
   * Conecta ao PostgreSQL
   */
  private async connectPostgres(): Promise<void> {
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
    } catch (error) {
      logger(
        "fatal",
        ` Error on try connect to Postgre Database! 🐘.\n${error}`,
        {
          timestampFormat: "time",
          showTimestamp: true,
        },
      );
      process.exit(1);
    }
  }

  async initialize(middlewares: any[] = []): Promise<void> {
    this.registerDecorators();
    this.setupSwagger();
    this.registerMiddlewares(middlewares);

    await this.app.listen(Number(env.PORT));
    await this.connectRedis();
    await this.connectPostgres();
  }
}
