import { v } from "azurajs/validators";
import "dotenv/config";

const envSchema = v.object({
  DATABASE_URL: v.string(),
  DATABASE_CERT_PATH: v.string(),
  REDIS_DATABASE_URL: v.string(),
  REDIS_DATABASE_CERT_PATH: v.string(),
  PORT: v.string(),
  NODE_ENV: v.string(),
  APP_URL: v.string().optional(),
  ENCRYPT_SECRET: v.string(),
  RESEND_API_KEY: v.string(),
});

export const mockEnv = {
  DATABASE_URL: "postgresql://test",
  DATABASE_CERT_PATH: "/test",
  REDIS_DATABASE_URL: "redis://test",
  REDIS_DATABASE_CERT_PATH: "/test",
  PORT: "3000",
  NODE_ENV: "test",
  APP_URL: "http://test",
  ENCRYPT_SECRET: "test-secret-key-min-32-chars-long!!",
  RESEND_API_KEY: "test",
};

export const env = envSchema.parse(
  process.env.NODE_ENV === "test" ? mockEnv : process.env,
);
