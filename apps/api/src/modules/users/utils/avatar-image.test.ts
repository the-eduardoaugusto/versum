import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  prepareAvatar,
  resizeAvatar,
  transformAvatarToWebp,
} from "./avatar-image.ts";

const AVATAR_DIMENSION = 512;

async function makeFixture({
  format,
  width,
  height,
}: {
  format: "png" | "jpeg" | "webp";
  width: number;
  height: number;
}): Promise<Buffer> {
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i += 3) {
    raw[i] = 255;
    raw[i + 1] = 0;
    raw[i + 2] = 0;
  }
  const image = sharp(raw, { raw: { width, height, channels: 3 } });

  switch (format) {
    case "png":
      return image.png().toBuffer();
    case "jpeg":
      return image.jpeg().toBuffer();
    case "webp":
      return image.webp().toBuffer();
  }
}

describe("transformAvatarToWebp", () => {
  it("converts a PNG buffer into a valid webp buffer", async () => {
    const input = await makeFixture({
      format: "png",
      width: AVATAR_DIMENSION,
      height: AVATAR_DIMENSION,
    });

    const output = await transformAvatarToWebp(input);
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("webp");
  });

  it("rejects bytes that are not a decodable image", async () => {
    const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);

    await expect(transformAvatarToWebp(garbage)).rejects.toThrow(
      "Error transforming avatar to WebP",
    );
  });
});

describe("resizeAvatar", () => {
  it("cover-crops a non-square JPEG down to 512x512", async () => {
    const input = await makeFixture({ format: "jpeg", width: 800, height: 400 });

    const output = await resizeAvatar(input);
    const metadata = await sharp(output).metadata();

    expect(metadata.width).toBe(AVATAR_DIMENSION);
    expect(metadata.height).toBe(AVATAR_DIMENSION);
  });

  it("skips resizing when the image is already 512x512", async () => {
    const input = await makeFixture({
      format: "png",
      width: AVATAR_DIMENSION,
      height: AVATAR_DIMENSION,
    });

    const output = await resizeAvatar(input);

    expect(output).toBe(input);
  });

  it("rejects bytes that are not a decodable image", async () => {
    const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);

    await expect(resizeAvatar(garbage)).rejects.toThrow("Error resizing avatar");
  });
});

describe("prepareAvatar", () => {
  it("resizes and converts a non-square PNG into a 512x512 webp buffer", async () => {
    const input = await makeFixture({ format: "png", width: 1024, height: 768 });

    const output = await prepareAvatar(input);
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(AVATAR_DIMENSION);
    expect(metadata.height).toBe(AVATAR_DIMENSION);
  });

  it("still converts to webp when the image is already 512x512 (resize skipped)", async () => {
    const input = await makeFixture({
      format: "png",
      width: AVATAR_DIMENSION,
      height: AVATAR_DIMENSION,
    });

    const output = await prepareAvatar(input);
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(AVATAR_DIMENSION);
    expect(metadata.height).toBe(AVATAR_DIMENSION);
  });

  it("rejects bytes that are not a decodable image", async () => {
    const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);

    await expect(prepareAvatar(garbage)).rejects.toThrow();
  });
});

describe("EXIF orientation handling", () => {
  it("rotates the image per EXIF orientation before cropping, so a sideways photo is not cropped as if it were still landscape", async () => {
    const width = 300;
    const height = 200;
    const raw = Buffer.alloc(width * height * 3);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        if (x < width / 2) {
          raw[i] = 255; // red left half
        } else {
          raw[i + 2] = 255; // blue right half
        }
      }
    }

    const input = await sharp(raw, { raw: { width, height, channels: 3 } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const output = await resizeAvatar(input);
    const { data, info } = await sharp(output)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const sample = (x: number, y: number) => {
      const idx = (y * info.width + x) * info.channels;
      return { r: data[idx] ?? 0, b: data[idx + 2] ?? 0 };
    };

    const centerX = Math.floor(info.width / 2);
    const top = sample(centerX, 10);
    const bottom = sample(centerX, info.height - 10);

    expect(top.r).toBeGreaterThan(top.b);
    expect(bottom.b).toBeGreaterThan(bottom.r);
  });
});
