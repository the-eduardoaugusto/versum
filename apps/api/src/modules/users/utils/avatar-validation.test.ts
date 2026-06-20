import { describe, expect, it } from "vitest";
import { assertValidAvatar, MAX_AVATAR_BYTES } from "./avatar-validation.ts";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe("assertValidAvatar", () => {
  it("accepts a valid jpeg", () => {
    expect(() =>
      assertValidAvatar({
        mimeType: "image/jpeg",
        size: JPEG.length,
        bytes: JPEG,
      }),
    ).not.toThrow();
  });

  it("accepts png and webp", () => {
    expect(() =>
      assertValidAvatar({
        mimeType: "image/png",
        size: PNG.length,
        bytes: PNG,
      }),
    ).not.toThrow();
    expect(() =>
      assertValidAvatar({
        mimeType: "image/webp",
        size: WEBP.length,
        bytes: WEBP,
      }),
    ).not.toThrow();
  });

  it("rejects disallowed mime", () => {
    expect(() =>
      assertValidAvatar({ mimeType: "image/gif", size: 4, bytes: JPEG }),
    ).toThrow(/type/i);
  });

  it("rejects oversized files", () => {
    expect(() =>
      assertValidAvatar({
        mimeType: "image/jpeg",
        size: MAX_AVATAR_BYTES + 1,
        bytes: JPEG,
      }),
    ).toThrow(/5/);
  });

  it("rejects declared-but-fake content (mime says png, bytes are jpeg)", () => {
    expect(() =>
      assertValidAvatar({
        mimeType: "image/png",
        size: JPEG.length,
        bytes: JPEG,
      }),
    ).toThrow(/content/i);
  });
});
