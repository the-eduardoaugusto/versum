import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, set } = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("../redis/index.ts", () => ({
  redis: { get, set },
}));

import { AvatarPresignCache } from "./avatar-presign-cache.ts";

describe("AvatarPresignCache", () => {
  let cache: AvatarPresignCache;

  beforeEach(() => {
    get.mockReset();
    set.mockReset();
    cache = new AvatarPresignCache();
  });

  describe("get", () => {
    it("returns the cached url on a hit", async () => {
      get.mockResolvedValue("https://cached.example/avatar.webp");

      const url = await cache.get({ userId: "user-1", avatarUpdatedAtMs: 1000 });

      expect(url).toBe("https://cached.example/avatar.webp");
      expect(get).toHaveBeenCalledWith("avatar-presigned-url:user-1:1000");
    });

    it("returns null on a miss", async () => {
      get.mockResolvedValue(null);

      const url = await cache.get({ userId: "user-1", avatarUpdatedAtMs: 1000 });

      expect(url).toBeNull();
    });

    it("builds a distinct key per userId and per avatar version", async () => {
      get.mockResolvedValue(null);

      await cache.get({ userId: "user-1", avatarUpdatedAtMs: 1000 });
      await cache.get({ userId: "user-2", avatarUpdatedAtMs: 1000 });
      await cache.get({ userId: "user-1", avatarUpdatedAtMs: 2000 });

      expect(get).toHaveBeenNthCalledWith(1, "avatar-presigned-url:user-1:1000");
      expect(get).toHaveBeenNthCalledWith(2, "avatar-presigned-url:user-2:1000");
      expect(get).toHaveBeenNthCalledWith(3, "avatar-presigned-url:user-1:2000");
    });

    it("propagates an error when the redis lookup fails", async () => {
      get.mockRejectedValue(new Error("connection reset"));

      await expect(
        cache.get({ userId: "user-1", avatarUpdatedAtMs: 1000 }),
      ).rejects.toThrow("connection reset");
    });
  });

  describe("set", () => {
    it("stores the url with the given ttl", async () => {
      set.mockResolvedValue("OK");

      await cache.set({
        userId: "user-1",
        avatarUpdatedAtMs: 1000,
        url: "https://signed.example/avatar.webp",
        ttlSeconds: 300,
      });

      expect(set).toHaveBeenCalledWith(
        "avatar-presigned-url:user-1:1000",
        "https://signed.example/avatar.webp",
        "EX",
        300,
      );
    });

    it("builds a distinct key per userId and per avatar version", async () => {
      set.mockResolvedValue("OK");

      await cache.set({
        userId: "user-2",
        avatarUpdatedAtMs: 5000,
        url: "https://signed.example/other.webp",
        ttlSeconds: 300,
      });

      expect(set).toHaveBeenCalledWith(
        "avatar-presigned-url:user-2:5000",
        "https://signed.example/other.webp",
        "EX",
        300,
      );
    });

    it("propagates an error when the redis write fails", async () => {
      set.mockRejectedValue(new Error("connection reset"));

      await expect(
        cache.set({
          userId: "user-1",
          avatarUpdatedAtMs: 1000,
          url: "https://signed.example/avatar.webp",
          ttlSeconds: 300,
        }),
      ).rejects.toThrow("connection reset");
    });
  });
});
