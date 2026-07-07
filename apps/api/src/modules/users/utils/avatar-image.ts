import { BadRequestError } from "@/utils/app/errors";

const DEFAULT_AVATAR_HEIGHT = 512;
const DEFAULT_AVATAR_WIDTH = 512;

export async function transformAvatarToWebp(bytes: Uint8Array) {
    try {
        const sharp = (await import("sharp")).default;
        const decoded = sharp(bytes);
        const result = await decoded.toFormat("webp").toBuffer();
        const resultMetadata = await sharp(result).metadata();
        if (resultMetadata.format !== "webp") {
            throw new BadRequestError("Failed to convert avatar to WebP format");
        }
        return result;
    } catch (_error) {
        throw new BadRequestError("Error transforming avatar to WebP");
    }
}

export async function resizeAvatar(bytes: Uint8Array) {
    try {
        const sharp = (await import("sharp")).default;
        const decoded = sharp(bytes);
        const metadata = await decoded.metadata();

        if (!metadata.width || !metadata.height) {
            throw new BadRequestError("Failed to retrieve image dimensions");
        }

        if (metadata.width === DEFAULT_AVATAR_WIDTH && metadata.height === DEFAULT_AVATAR_HEIGHT) {
            return bytes;
        }
        const result = await decoded.rotate().resize(DEFAULT_AVATAR_WIDTH, DEFAULT_AVATAR_HEIGHT, {
            fit: "cover",
            position: sharp.strategy.attention,
        }).toBuffer();
        return result;
    } catch (_error) {
        throw new BadRequestError("Error resizing avatar");
    }

}

export async function prepareAvatar(bytes: Uint8Array) {
    const resized = await resizeAvatar(bytes);
    const webp = await transformAvatarToWebp(resized);
    return webp;
}