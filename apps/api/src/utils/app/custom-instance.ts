import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "@versum/logger";
import type { Hono } from "hono";
import { validationErrorHook } from "@/utils/app/errors/validation.hook.ts";
import { env } from "@/utils/env/parser.ts";
import { SetupCron } from "./setups/setup-cron.ts";
import { SetupListeners } from "./setups/setup-listeners.ts";
import { SetupMiddlewares } from "./setups/setup-middlewares.ts";
import { SetupPlugins } from "./setups/setup-plugins.ts";
import { SetupRoutes } from "./setups/setup-routes.ts";

export class App {
  public readonly hono = new OpenAPIHono({
    defaultHook: validationErrorHook,
  });

  constructor() {
    this.setup();
  }

  setup() {
    new SetupPlugins({ app: this.hono });
    new SetupListeners({ app: this.hono });
    new SetupMiddlewares({ app: this.hono });
    new SetupRoutes({ app: this.hono });
    new SetupCron();
  }

  route(path: string, app: Hono) {
    this.hono.route(path, app);
    return this;
  }

  get fetch() {
    return this.hono.fetch;
  }

  showRoutes() {
    const seen = new Set<string>();

    const routes = this.hono.routes.filter((route) => {
      if (route.method === "ALL" || route.path === "/*") return false;

      const key = `${route.method}:${route.path}`;
      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });

    logger({ level: "info", icon: "🪧" }, "Routes:");
    routes.forEach((route) => {
      logger({ level: "info", icon: "  " }, `[${route.method}]`, route.path);
    });
  }

  private async readTlsCerts() {
    if (env.BUN_ENV !== "development") return;
    const certs = await Promise.all([
      Bun.file(".certs/tls.key.pem").text(),
      Bun.file(".certs/tls.cert.pem").text(),
    ]);

    if (!certs[0] || !certs[1]) {
      throw new Error(
        "Failed to read TLS certificates. Please check the file paths and permissions.",
      );
    }

    logger("info", "Successfully read TLS certificates.");
    return certs;
  }

  async start() {
    try {
      this.showRoutes();
      const certs = await this.readTlsCerts();
      const server = Bun.serve({
        fetch: this.hono.fetch,
        port: env.PORT,
        tls: {
          cert: certs?.[1],
          key: certs?.[0],
        },
      });
      logger(
        "info",
        `Server is running on port ${server.port} with TLS: ${!!certs}`,
      );
    } catch (error) {
      logger("error", "Failed to start server:", error);
      process.exit(1);
    }
  }
}
