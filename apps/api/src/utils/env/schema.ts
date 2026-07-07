import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string("Database URL is required"),
  REDIS_DATABASE_URL: z.string("Redis database URL is required"),
  PORT: z.string("Port is required"),
  BUN_ENV: z.string("Bun env is required"),
  ENCRYPT_SECRET: z.string("Encrypt secret is required"),
  RESEND_API_KEY: z.string("Resend API key is required"),
  DEBUG: z.string().optional(),
  WEB_CLIENT_APP_URL: z.url("Web client app URL is required"),
  DISCORD_WEBHOOK_URL: z.string("Discord webhook URL is required"),
  CRON_ENABLED: z.string().default("true"),
  METADATA_HASH_SECRET: z.string().min(32),
  AWS_ACCESS_KEY_ID: z.string("AWS access key ID is required"),
  AWS_DEFAULT_REGION: z.string("AWS default region is required"),
  AWS_ENDPOINT_URL: z.string("AWS endpoint URL is required"),
  AWS_S3_BUCKET_NAME: z.string("AWS S3 bucket name is required"),
  AWS_SECRET_ACCESS_KEY: z.string("AWS secret access key is required"),
});
