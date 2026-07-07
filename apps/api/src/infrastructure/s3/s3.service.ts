import { InternalServerError } from "@/utils/app/errors/index.ts";
import { avatarPath, s3 } from "./index";
import { AvatarPresignCache } from "./avatar-presign-cache";

export class S3Service {

  private cache: AvatarPresignCache;
  private readonly PRESIGNED_URL_TTL_SECONDS = 60 * 5; // 5 minutes
  private readonly bucket: typeof s3;

  constructor({ cache, bucket }: { cache?: AvatarPresignCache; bucket?: typeof s3 } = {}) {
    this.cache = cache ?? new AvatarPresignCache();
    this.bucket = bucket ?? s3;
  }

  async uploadAvatarWebp({
    userId,
    bytes,
    avatarUpdatedAt,
  }: {
    userId: string;
    bytes: Buffer;
    avatarUpdatedAt: Date;
  }): Promise<void> {
    await this.bucket.write(avatarPath({ userId, avatarUpdatedAt }), bytes, {
      type: "image/webp"
    }).catch(() => {
      throw new InternalServerError("Failed to upload avatar to S3");
    });
  }

  async destroyAvatar({ userId, avatarUpdatedAt }: { userId: string, avatarUpdatedAt: Date }): Promise<void> {
    await this.bucket.delete(avatarPath({ userId, avatarUpdatedAt })).catch(() => {
      throw new InternalServerError("Failed to delete avatar from S3");
    });
  }

  async getAvatarUrl({ userId, avatarUpdatedAt }: { userId: string; avatarUpdatedAt: Date }): Promise<string | null> {
    const avatarUpdatedAtMs = avatarUpdatedAt.getTime();
    const cached = await this.cache.get({ userId, avatarUpdatedAtMs });

    if (cached) return cached;

    const presignedUrl = this.bucket.presign(avatarPath({ userId, avatarUpdatedAt }), {
      method: "GET",
      expiresIn: this.PRESIGNED_URL_TTL_SECONDS,
    })
    await this.cache.set({
      userId,
      avatarUpdatedAtMs,
      url: presignedUrl,
      ttlSeconds: this.PRESIGNED_URL_TTL_SECONDS
    });
    return presignedUrl;
  }
}
