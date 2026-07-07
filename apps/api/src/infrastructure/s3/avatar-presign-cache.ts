import { redis } from "../redis/index.ts";

const CACHE_KEY_PREFIX = "avatar-presigned-url";

function buildCacheKey({
    userId,
    avatarUpdatedAtMs,
}: {
    userId: string;
    avatarUpdatedAtMs: number;
}): string {
    return `${CACHE_KEY_PREFIX}:${userId}:${avatarUpdatedAtMs}`;
}

export class AvatarPresignCache {
    private readonly cache: typeof redis;

    constructor({ cache }: { cache?: typeof redis } = {}) {
        this.cache = cache ?? redis;
    }

    async get({ userId, avatarUpdatedAtMs }: { userId: string; avatarUpdatedAtMs: number }): Promise<string | null> {
        return await this.cache.get(
            buildCacheKey({ userId, avatarUpdatedAtMs })
        );
    }

    async set({
        userId,
        avatarUpdatedAtMs,
        url,
        ttlSeconds,
    }: {
        userId: string;
        avatarUpdatedAtMs: number;
        url: string;
        ttlSeconds: number;
    }): Promise<void> {
        await this.cache.set(
            buildCacheKey({ userId, avatarUpdatedAtMs }),
            url,
            "EX",
            ttlSeconds
        );
    }
}