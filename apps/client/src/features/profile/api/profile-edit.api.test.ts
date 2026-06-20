import { describe, expect, it } from "vitest";

import { MAX_AVATAR_BYTES, validateAvatarFile } from "./profile-edit.api";

function fakeFile(type: string, size: number): File {
  const f = new File([new Uint8Array(1)], "a", { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

describe("validateAvatarFile", () => {
  it("accepts a valid jpeg under the limit", () => {
    expect(validateAvatarFile(fakeFile("image/jpeg", 1000))).toBeNull();
  });

  it("rejects disallowed types", () => {
    expect(validateAvatarFile(fakeFile("image/gif", 1000))).toMatch(
      /JPEG|PNG|WEBP/i,
    );
  });

  it("rejects oversized files", () => {
    expect(
      validateAvatarFile(fakeFile("image/png", MAX_AVATAR_BYTES + 1)),
    ).toMatch(/5/);
  });
});
