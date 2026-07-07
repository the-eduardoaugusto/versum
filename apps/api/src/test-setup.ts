import { vi } from "vitest";

const env = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  DATABASE_CERT_PATH: "/test",
  REDIS_DATABASE_URL: "redis://localhost:6379",
  REDIS_DATABASE_CERT_PATH: "/test",
  PORT: "3000",
  BUN_ENV: "test",
  DISCORD_WEBHOOK_URL:
    "https://discord.com/api/webhooks/webhook_id/webhook_token",
  ENCRYPT_SECRET: "test-secret-key-min-32-chars-long!!",
  METADATA_HASH_SECRET: "test-metadata-hash-secret-32chars!",
  RESEND_API_KEY: "test",
  WEB_CLIENT_APP_URL: "http://localhost:3000",
  AWS_ACCESS_KEY_ID: "test-access-key-id",
  AWS_SECRET_ACCESS_KEY: "test-secret-access-key",
  AWS_DEFAULT_REGION: "us-east-1",
  AWS_ENDPOINT_URL: "https://s3.test.internal",
  AWS_S3_BUCKET_NAME: "test-bucket",
};

Object.defineProperty(globalThis, "Bun", {
  value: {
    env,
    file: vi.fn().mockReturnValue({
      text: vi.fn().mockResolvedValue("mock-cert-content"),
    }),
  },
  writable: true,
});
