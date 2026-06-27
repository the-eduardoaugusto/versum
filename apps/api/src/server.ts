import { Hono } from "hono";
import { App } from "@/utils/app/index.ts";

const helloWorld = new Hono().get("/", async (ctx) => {
  return ctx.text("Hello world!");
});
const app = new App();

app.route("/", helloWorld);

app.start();
