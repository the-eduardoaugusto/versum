import { beforeEach, describe, expect, it, vi } from "vitest";

const { write, destroy, presign } = vi.hoisted(() => ({
  write: vi.fn(),
  destroy: vi.fn(),
  presign: vi.fn(),
}));

vi.mock("./index", () => ({
  s3: { write, delete: destroy, presign },
  avatarPath: ({
    userId,
    avatarUpdatedAt,
  }: {
    userId: string;
    avatarUpdatedAt: Date;
  }) => `avatars/${userId}/${avatarUpdatedAt.getTime()}.webp`,
}));

const { cacheGet, cacheSet } = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}));

vi.mock("./avatar-presign-cache", () => ({
  AvatarPresignCache: vi.fn().mockImplementation(function AvatarPresignCache() {
    return { get: cacheGet, set: cacheSet };
  }),
}));

import { S3Service } from "./s3.service.ts";

const PRESIGNED_URL_TTL_SECONDS = 60 * 5;

describe("S3Service", () => {
  let service: S3Service;
  const avatarUpdatedAt = new Date("2024-01-01T00:00:00Z");
  const path = `avatars/user-1/${avatarUpdatedAt.getTime()}.webp`;

  beforeEach(() => {
    write.mockReset();
    destroy.mockReset();
    presign.mockReset();
    cacheGet.mockReset();
    cacheSet.mockReset();
    service = new S3Service();
  });

  describe("uploadAvatarWebp", () => {
    it("uploads the bytes to the versioned avatar path as webp", async () => {
      write.mockResolvedValue(undefined);
      const bytes = Buffer.from([1, 2, 3]);

      await service.uploadAvatarWebp({ userId: "user-1", avatarUpdatedAt, bytes });

      expect(write).toHaveBeenCalledWith(path, bytes, { type: "image/webp" });
    });

    it("throws InternalServerError when the S3 write fails", async () => {
      write.mockRejectedValue(new Error("network error"));

      await expect(
        service.uploadAvatarWebp({
          userId: "user-1",
          avatarUpdatedAt,
          bytes: Buffer.from([1]),
        }),
      ).rejects.toThrow("Failed to upload avatar to S3");
    });
  });

  describe("destroyAvatar", () => {
    it("deletes the versioned avatar object", async () => {
      destroy.mockResolvedValue(undefined);

      await service.destroyAvatar({ userId: "user-1", avatarUpdatedAt });

      expect(destroy).toHaveBeenCalledWith(path);
    });

    it("throws InternalServerError when the S3 delete fails", async () => {
      destroy.mockRejectedValue(new Error("network error"));

      await expect(
        service.destroyAvatar({ userId: "user-1", avatarUpdatedAt }),
      ).rejects.toThrow("Failed to delete avatar from S3");
    });
  });

  describe("getAvatarUrl", () => {
    it("returns the cached url without calling presign", async () => {
      cacheGet.mockResolvedValue("https://cached.example/avatar.webp");

      const url = await service.getAvatarUrl({ userId: "user-1", avatarUpdatedAt });

      expect(url).toBe("https://cached.example/avatar.webp");
      expect(presign).not.toHaveBeenCalled();
      expect(cacheSet).not.toHaveBeenCalled();
    });

    it("signs and caches a fresh url on a cache miss", async () => {
      cacheGet.mockResolvedValue(null);
      presign.mockReturnValue("https://signed.example/avatar.webp");
      cacheSet.mockResolvedValue(undefined);

      const url = await service.getAvatarUrl({ userId: "user-1", avatarUpdatedAt });

      expect(url).toBe("https://signed.example/avatar.webp");
      expect(presign).toHaveBeenCalledWith(path, {
        method: "GET",
        expiresIn: PRESIGNED_URL_TTL_SECONDS,
      });
      expect(cacheSet).toHaveBeenCalledWith({
        userId: "user-1",
        avatarUpdatedAtMs: avatarUpdatedAt.getTime(),
        url: "https://signed.example/avatar.webp",
        ttlSeconds: PRESIGNED_URL_TTL_SECONDS,
      });
    });

    it("uses a distinct cache lookup per avatar version", async () => {
      cacheGet.mockResolvedValue(null);
      presign.mockReturnValue("https://signed.example/avatar.webp");

      const otherAvatarUpdatedAt = new Date("2024-06-01T00:00:00Z");
      await service.getAvatarUrl({
        userId: "user-1",
        avatarUpdatedAt: otherAvatarUpdatedAt,
      });

      expect(cacheGet).toHaveBeenCalledWith({
        userId: "user-1",
        avatarUpdatedAtMs: otherAvatarUpdatedAt.getTime(),
      });
    });

    it("propagates an error when the cache lookup fails", async () => {
      cacheGet.mockRejectedValue(new Error("redis down"));

      await expect(
        service.getAvatarUrl({ userId: "user-1", avatarUpdatedAt }),
      ).rejects.toThrow("redis down");
      expect(presign).not.toHaveBeenCalled();
    });

    it("propagates an error when presign itself throws", async () => {
      cacheGet.mockResolvedValue(null);
      presign.mockImplementation(() => {
        throw new Error("invalid credentials");
      });

      await expect(
        service.getAvatarUrl({ userId: "user-1", avatarUpdatedAt }),
      ).rejects.toThrow("invalid credentials");
      expect(cacheSet).not.toHaveBeenCalled();
    });

    it("propagates an error when caching the freshly signed url fails", async () => {
      cacheGet.mockResolvedValue(null);
      presign.mockReturnValue("https://signed.example/avatar.webp");
      cacheSet.mockRejectedValue(new Error("redis down"));

      await expect(
        service.getAvatarUrl({ userId: "user-1", avatarUpdatedAt }),
      ).rejects.toThrow("redis down");
    });
  });
});
