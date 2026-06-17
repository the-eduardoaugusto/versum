import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./index.ts", async () => {
  const fns = {
    mockUploadStream: vi.fn(),
    mockDestroy: vi.fn(),
  };

  // Store for test access
  (globalThis as any).__cloudinaryMocks = fns;

  return {
    cloudinary: {
      uploader: {
        upload_stream: fns.mockUploadStream,
        destroy: fns.mockDestroy,
      },
    },
    avatarPublicId: (userId: string) => `versum/avatars/${userId}`,
  };
});

import { CloudinaryService } from "./cloudinary.service.ts";

describe("CloudinaryService", () => {
  beforeEach(() => {
    const { mockUploadStream, mockDestroy } = (globalThis as any).__cloudinaryMocks;
    mockUploadStream.mockReset();
    mockDestroy.mockReset();
  });

  it("uploads bytes and resolves the secure_url", async () => {
    const { mockUploadStream } = (globalThis as any).__cloudinaryMocks;
    mockUploadStream.mockImplementation((_opts: any, cb: any) => {
      const stream = {
        end: () => cb(null, { secure_url: "https://res.cloudinary.com/x/y.webp" }),
      };
      return stream;
    });

    const service = new CloudinaryService();
    const url = await service.uploadAvatar({
      userId: "user-1",
      bytes: Buffer.from([0xff, 0xd8, 0xff]),
    });

    expect(url).toBe("https://res.cloudinary.com/x/y.webp");
    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({ public_id: "versum/avatars/user-1", overwrite: true }),
      expect.any(Function),
    );
  });

  it("rejects when Cloudinary returns an error", async () => {
    const { mockUploadStream } = (globalThis as any).__cloudinaryMocks;
    mockUploadStream.mockImplementation((_opts: any, cb: any) => ({
      end: () => cb(new Error("boom"), undefined),
    }));
    const service = new CloudinaryService();
    await expect(
      service.uploadAvatar({ userId: "u", bytes: Buffer.from([1]) }),
    ).rejects.toThrow();
  });

  it("destroys by deterministic public_id", async () => {
    const { mockDestroy } = (globalThis as any).__cloudinaryMocks;
    mockDestroy.mockResolvedValue({ result: "ok" });
    const service = new CloudinaryService();
    await service.destroyAvatar({ userId: "user-1" });
    expect(mockDestroy).toHaveBeenCalledWith("versum/avatars/user-1", { invalidate: true });
  });
});
