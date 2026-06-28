import { OpenAPIHono } from "@hono/zod-openapi";
import { createJourneyRoutesV1 } from "./journey/routes/index.ts";

export const createReadingRoutes = () => {
  const router = new OpenAPIHono();

  router.route("/journey", createJourneyRoutesV1());
  return router;
};
