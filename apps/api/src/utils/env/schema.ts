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
  CLOUDINARY_CLOUD_NAME: z.string("Cloudinary cloud name is required"),
  CLOUDINARY_API_KEY: z.string("Cloudinary API key is required"),
  CLOUDINARY_API_SECRET: z.string("Cloudinary API secret is required"),
});
