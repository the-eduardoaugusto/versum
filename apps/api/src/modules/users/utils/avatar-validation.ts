import { BadRequestError } from "@/utils/app/errors/index.ts";

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type AllowedMime = (typeof ALLOWED_AVATAR_MIME)[number];

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((b, i) => bytes[i] === b);
}

function matchesMagicBytes(mime: AllowedMime, bytes: Uint8Array): boolean {
  switch (mime) {
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(
        bytes,
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      );
    case "image/webp":
      return (
        startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && // "RIFF"
        bytes.length >= 12 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50 // "WEBP"
      );
  }
}

export function assertValidAvatar({
  mimeType,
  size,
  bytes,
}: {
  mimeType: string;
  size: number;
  bytes: Uint8Array;
}): void {
  if (!ALLOWED_AVATAR_MIME.includes(mimeType as AllowedMime)) {
    throw new BadRequestError(
      "Avatar must be a JPEG, PNG or WEBP image (unsupported type)",
    );
  }

  if (size > MAX_AVATAR_BYTES) {
    throw new BadRequestError("Avatar must not exceed 5 MB");
  }

  if (!matchesMagicBytes(mimeType as AllowedMime, bytes)) {
    throw new BadRequestError("Avatar file content does not match its type");
  }
}
