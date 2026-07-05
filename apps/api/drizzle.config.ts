import { defineConfig } from "drizzle-kit";

const dbCredentials = {
  url: process.env.DATABASE_URL!,
}

console.log("dbCredentials:", dbCredentials);

export default defineConfig({
  out: "./drizzle",
  schema: "./src/infrastructure/db/schema.ts",
  dialect: "postgresql",
  dbCredentials
});
