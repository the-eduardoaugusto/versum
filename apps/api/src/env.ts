import { v } from "azurajs/validators";
import "dotenv/config";

const envSchema = v.object({
  DATABASE_URL: v.string(),
  PORT: v.string(),
});

export const env = envSchema.parse(process.env);
