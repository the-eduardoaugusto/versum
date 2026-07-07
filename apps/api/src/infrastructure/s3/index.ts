import { env } from "@/utils/env/index.ts";
import { S3Client } from "bun";

export const s3 = new S3Client({
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  endpoint: env.AWS_ENDPOINT_URL,
  bucket: env.AWS_S3_BUCKET_NAME,
  region: env.AWS_DEFAULT_REGION,
});

export function avatarPath({
  userId,
  avatarUpdatedAt,
}: {
  userId: string;
  avatarUpdatedAt: Date;
}): string {
  return `avatars/${userId}/${avatarUpdatedAt.getTime()}.webp`;
}