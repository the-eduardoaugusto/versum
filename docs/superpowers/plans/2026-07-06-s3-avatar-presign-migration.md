# S3 Avatar Presign Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Cloudinary → Railway/S3 migration for profile avatars: convert uploads to WEBP server-side, store avatars at S3 under a version-scoped key, serve them through on-demand presigned URLs cached in Redis (no re-signing within the TTL window, no stale-URL/browser-cache problems), and drop `profiles.picture_url` in favor of `profiles.avatar_updated_at`.

**Architecture:** `Bun.S3Client` (already wired in `src/infrastructure/s3/index.ts`) stores each avatar at `avatars/{userId}/{avatarUpdatedAt-ms}.webp` — the timestamp in the key doubles as a cache-busting version, so a re-upload can never collide with (or be shadowed by) the previous cached URL. `ProfileServiceV1` tracks only `avatarUpdatedAt: Date | null` on the profile row; the actual URL is never persisted. `S3Service.getAvatarUrl()` is the only place that mints a presigned GET URL: it checks a Redis-backed `AvatarPresignCache` keyed by `userId:avatarUpdatedAtMs` first, and only calls `s3.presign()` on a miss, then caches the result with a TTL slightly shorter than the presign expiry. Upload/delete flows in the controller call the new `avatar-image.ts` util to decode, resize (512×512 cover crop) and re-encode to WEBP, verifying the output is really WEBP before it's written to S3.

**Tech Stack:** Bun `S3Client`/`RedisClient` (both in `bun` std lib — no `@aws-sdk/client-s3`), `sharp` (new dependency, image decode/resize/encode), Drizzle ORM + drizzle-kit (migration), Vitest.

## Global Constraints

- Use Bun's built-in `S3Client` (`import { S3Client } from "bun"`) for all S3 operations — do NOT reintroduce `@aws-sdk/client-s3` (already removed from `apps/api/package.json`).
- Presigned URLs are generated on demand only, cached in Redis to avoid duplicate signing and to avoid the URL changing on every request within the TTL window.
- `profiles.picture_url` is removed; there is no direct client-supplied avatar URL anymore. Avatar URL is always server-computed from `avatarUpdatedAt`.
- Controllers in this codebase are thin wiring layers and are not unit-tested anywhere in the repo (confirmed: no `*.controller.test.ts` files exist). Keep that convention — logic that needs coverage belongs in services/utils/infrastructure classes, which ARE tested.
- Follow existing module conventions: constructor dependency injection with an options object (`{ dep }: { dep?: Dep } = {}`), `vi.hoisted` + `vi.mock` for mocking sibling modules in tests (see `cloudinary.service.test.ts` for the reference pattern).

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/api/src/test-setup.ts` | Modify — fix broken env mocks (AWS vars missing today) |
| `apps/api/package.json` | Modify — add `sharp`, remove `cloudinary` |
| `apps/api/src/modules/users/utils/avatar-image.ts` | New — decode/resize/encode avatar to WEBP, verify output |
| `apps/api/src/modules/users/utils/avatar-image.test.ts` | New — tests for the above |
| `apps/api/src/modules/users/db/profiles.table.ts` | Modify — `pictureUrl` → `avatarUpdatedAt` |
| `apps/api/drizzle/*` | Generated migration |
| `apps/api/src/modules/users/services/profile.v1.service.ts` | Modify — drop picture-URL validation, add `setAvatarUpdatedAt`/`clearAvatar` |
| `apps/api/src/modules/users/services/profile.v1.service.test.ts` | Modify — update to match |
| `apps/api/src/modules/users/schemas/v1/profiles.v1.common.schema.ts` | Modify — drop `pictureUrl`, add `avatarUrl` (output only) |
| `apps/api/src/infrastructure/s3/avatar-presign-cache.ts` | New — Redis-backed presigned URL cache |
| `apps/api/src/infrastructure/s3/avatar-presign-cache.test.ts` | New — tests for the above |
| `apps/api/src/infrastructure/s3/index.ts` | Modify — `avatarPath()` becomes version-scoped |
| `apps/api/src/infrastructure/s3/s3.service.ts` | Modify — versioned upload/delete + `getAvatarUrl()` |
| `apps/api/src/infrastructure/s3/s3.service.test.ts` | New — tests for the above |
| `apps/api/src/modules/users/controllers/profile.v1.controller.ts` | Modify — swap Cloudinary for S3 + image conversion + avatarUrl in every response |
| `apps/api/src/infrastructure/cloudinary/*` | Delete |

---

### Task 1: Fix the broken test environment baseline

The test suite is currently red on `main`/`development`: `src/utils/env/schema.ts` requires `AWS_ACCESS_KEY_ID`, `AWS_DEFAULT_REGION`, `AWS_ENDPOINT_URL`, `AWS_S3_BUCKET_NAME`, `AWS_SECRET_ACCESS_KEY`, but `src/test-setup.ts` still only stubs the old `CLOUDINARY_*` vars. `env = envSchema.parse(Bun.env)` throws at import time, so any test that transitively imports `@/utils/env` fails. Fix this first so every later task has a green baseline to work from.

**Files:**
- Modify: `apps/api/src/test-setup.ts`

**Interfaces:**
- Produces: a `Bun.env` mock that satisfies `envSchema` (`apps/api/src/utils/env/schema.ts`) so `env` parses successfully in tests.

- [ ] **Step 1: Run the full suite to confirm the current failure**

Run: `cd apps/api && bun run test 2>&1 | tail -30`
Expected: FAIL — `ZodError` mentioning `AWS_ACCESS_KEY_ID`/`AWS_DEFAULT_REGION`/`AWS_ENDPOINT_URL`/`AWS_S3_BUCKET_NAME`/`AWS_SECRET_ACCESS_KEY`, "6 failed" test files.

- [ ] **Step 2: Replace the Cloudinary env stubs with AWS + Redis stubs**

Edit `apps/api/src/test-setup.ts` to:

```ts
import { vi } from "vitest";

const env = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  DATABASE_CERT_PATH: "/test",
  REDIS_DATABASE_URL: "redis://localhost:6379",
  REDIS_DATABASE_CERT_PATH: "/test",
  PORT: "3000",
  BUN_ENV: "test",
  DISCORD_WEBHOOK_URL:
    "https://discord.com/api/webhooks/webhook_id/webhook_token",
  ENCRYPT_SECRET: "test-secret-key-min-32-chars-long!!",
  METADATA_HASH_SECRET: "test-metadata-hash-secret-32chars!",
  RESEND_API_KEY: "test",
  WEB_CLIENT_APP_URL: "http://localhost:3000",
  AWS_ACCESS_KEY_ID: "test-access-key-id",
  AWS_SECRET_ACCESS_KEY: "test-secret-access-key",
  AWS_DEFAULT_REGION: "us-east-1",
  AWS_ENDPOINT_URL: "https://s3.test.internal",
  AWS_S3_BUCKET_NAME: "test-bucket",
};

Object.defineProperty(globalThis, "Bun", {
  value: {
    env,
    file: vi.fn().mockReturnValue({
      text: vi.fn().mockResolvedValue("mock-cert-content"),
    }),
  },
  writable: true,
});
```

- [ ] **Step 3: Run the full suite again to confirm the baseline is green**

Run: `cd apps/api && bun run test 2>&1 | tail -30`
Expected: PASS — `0 failed` (any remaining failures at this point are pre-existing and unrelated; if you see any, stop and investigate before continuing — do not build on a red baseline).

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/test-setup.ts
git commit -m "fix(api): replace stale Cloudinary env stubs with AWS stubs in test setup"
```

---

### Task 2: Avatar image conversion util (decode, resize, WEBP encode, verify)

New logic requested: convert the uploaded avatar to WEBP and validate that the result really is a WEBP (not just trust the encoder). `assertValidAvatar` (existing, in `avatar-validation.ts`) already rejects disallowed mime types and checks magic bytes on the *input* — this task adds real image decoding (so corrupt/non-image bytes that happen to pass the magic-byte check are still caught), a 512×512 cover-crop resize, and WEBP re-encoding with a magic-byte check on the *output*.

**Files:**
- Create: `apps/api/src/modules/users/utils/avatar-image.ts`
- Test: `apps/api/src/modules/users/utils/avatar-image.test.ts`
- Modify: `apps/api/package.json` (add `sharp`)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `convertAvatarToWebp(bytes: Uint8Array): Promise<Buffer>` and `AVATAR_DIMENSION: number`, consumed by the controller in Task 8.

- [ ] **Step 1: Add the `sharp` dependency**

Run: `cd apps/api && bun add sharp`
Expected: `apps/api/package.json` gains `"sharp": "^<version>"` under `dependencies`; `bun.lock` updates.

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/modules/users/utils/avatar-image.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { AVATAR_DIMENSION, convertAvatarToWebp } from "./avatar-image.ts";

async function makeFixture(format: "png" | "jpeg"): Promise<Buffer> {
  const width = 200;
  const height = 100;
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i += 3) {
    raw[i] = 255;
    raw[i + 1] = 0;
    raw[i + 2] = 0;
  }
  const image = sharp(raw, { raw: { width, height, channels: 3 } });
  return format === "png" ? image.png().toBuffer() : image.jpeg().toBuffer();
}

describe("convertAvatarToWebp", () => {
  it("converts a PNG into a square webp buffer", async () => {
    const input = await makeFixture("png");

    const output = await convertAvatarToWebp(input);
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(AVATAR_DIMENSION);
    expect(metadata.height).toBe(AVATAR_DIMENSION);
  });

  it("cover-crops a non-square JPEG to a square webp buffer", async () => {
    const input = await makeFixture("jpeg");

    const output = await convertAvatarToWebp(input);
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(AVATAR_DIMENSION);
    expect(metadata.height).toBe(AVATAR_DIMENSION);
  });

  it("rejects bytes that are not a decodable image", async () => {
    const garbage = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);

    await expect(convertAvatarToWebp(garbage)).rejects.toThrow(
      "Avatar file is corrupted or not a valid image",
    );
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `cd apps/api && bunx vitest run src/modules/users/utils/avatar-image.test.ts`
Expected: FAIL — `Cannot find module './avatar-image.ts'`.

- [ ] **Step 4: Implement**

Create `apps/api/src/modules/users/utils/avatar-image.ts`:

```ts
import sharp from "sharp";
import { BadRequestError } from "@/utils/app/errors/index.ts";

export const AVATAR_DIMENSION = 512;

const WEBP_RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46]; // "RIFF"

function isWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  return (
    WEBP_RIFF_SIGNATURE.every((byte, i) => bytes[i] === byte) &&
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  );
}

export async function convertAvatarToWebp(
  bytes: Uint8Array,
): Promise<Buffer> {
  let output: Buffer;

  try {
    output = await sharp(bytes)
      .rotate()
      .resize(AVATAR_DIMENSION, AVATAR_DIMENSION, {
        fit: "cover",
        position: "attention",
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new BadRequestError(
      "Avatar file is corrupted or not a valid image",
    );
  }

  if (!isWebp(output)) {
    throw new BadRequestError(
      "Avatar conversion did not produce a valid WEBP image",
    );
  }

  return output;
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd apps/api && bunx vitest run src/modules/users/utils/avatar-image.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/api/package.json apps/api/bun.lock apps/api/src/modules/users/utils/avatar-image.ts apps/api/src/modules/users/utils/avatar-image.test.ts
git commit -m "feat(api): add avatar image conversion to WEBP with output validation"
```

---

### Task 3: Replace `profiles.picture_url` with `profiles.avatar_updated_at`

**Files:**
- Modify: `apps/api/src/modules/users/db/profiles.table.ts`
- Generated: new file under `apps/api/drizzle/`

**Interfaces:**
- Produces: `Profile.avatarUpdatedAt: Date | null` (via Drizzle's `InferSelectModel`, consumed by Tasks 4, 7, 8). `Profile.pictureUrl` no longer exists.

- [ ] **Step 1: Edit the table definition**

In `apps/api/src/modules/users/db/profiles.table.ts`, replace:

```ts
    pictureUrl: varchar("picture_url", { length: 500 }),
```

with:

```ts
    avatarUpdatedAt: timestamp("avatar_updated_at", {
      precision: 3,
      withTimezone: true,
    }),
```

(`timestamp` is already imported in this file.)

- [ ] **Step 2: Generate the migration**

Run: `cd apps/api && bunx drizzle-kit generate`
Expected: a new `drizzle/000X_<name>.sql` containing `ALTER TABLE "profiles" DROP COLUMN "picture_url";` and `ALTER TABLE "profiles" ADD COLUMN "avatar_updated_at" timestamp(3) with time zone;` (order may vary), plus an updated `drizzle/meta/_journal.json` and a new `drizzle/meta/000X_snapshot.json`.

- [ ] **Step 3: Confirm the generated SQL matches expectations**

Run: `cat apps/api/drizzle/000X_<name>.sql` (use the actual filename from Step 2)
Expected: exactly one `DROP COLUMN "picture_url"` and one `ADD COLUMN "avatar_updated_at"` statement against the `profiles` table, no unrelated changes.

- [ ] **Step 4: Typecheck to confirm the type ripple**

Run: `cd apps/api && bun run typecheck 2>&1 | head -60`
Expected: FAIL — errors in `profile.v1.service.ts`, `profile.v1.controller.ts`, `profile.v1.service.test.ts`, and `profiles.v1.common.schema.ts` (anywhere `pictureUrl` is referenced). This is expected — Tasks 4, 5 and 8 fix these. Read the error list now so you know exactly what the later tasks must touch.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/users/db/profiles.table.ts apps/api/drizzle
git commit -m "feat(api): migrate profiles.picture_url to profiles.avatar_updated_at"
```

---

### Task 4: Update `ProfileServiceV1` for `avatarUpdatedAt`

Drop all picture-URL validation (no longer a client-supplied field). Add two focused methods the controller will call: `setAvatarUpdatedAt` (after a successful S3 upload) and `clearAvatar` (after a successful S3 delete). Both reuse `assertProfileEditable` so the existing consent-check/not-found/forbidden behavior is preserved.

**Files:**
- Modify: `apps/api/src/modules/users/services/profile.v1.service.ts`
- Modify: `apps/api/src/modules/users/services/profile.v1.service.test.ts`

**Interfaces:**
- Consumes: `Profile` type from `../repositories/profile.types.repository` (now has `avatarUpdatedAt: Date | null`, no `pictureUrl`), from Task 3.
- Produces: `ProfileServiceV1.setAvatarUpdatedAt({ userId, avatarUpdatedAt }): Promise<Profile>` and `ProfileServiceV1.clearAvatar({ userId }): Promise<Profile>`, consumed by the controller in Task 8.

- [ ] **Step 1: Update the test fixture and remove picture-URL test cases**

In `apps/api/src/modules/users/services/profile.v1.service.test.ts`:

Replace line 14 (`pictureUrl: "https://example.com/avatar.jpg",`) with:

```ts
    avatarUpdatedAt: null,
```

Replace line 137 (`        pictureUrl: null,`) — inside the `createParams` object in the "should create a new profile with sanitized data" test — by deleting that line entirely (no replacement; `avatarUpdatedAt` is not part of the public create payload).

Delete the two tests `"should throw error for invalid picture URL"` and `"should throw error for non-HTTPS picture URL"` (currently around lines 278–314) in their entirety, including their `it(...)` wrapper.

- [ ] **Step 2: Add failing tests for the new methods**

Add this new `describe` block at the end of the file (before the final closing of the outer `describe`, i.e. as a sibling to `describe("updateProfile", ...)`):

```ts
  describe("setAvatarUpdatedAt", () => {
    it("updates avatarUpdatedAt for the editable profile", async () => {
      const mockRepository = createMockRepository();
      const mockConsentLogsRepository = createMockConsentLogsRepository();
      mockConsentLogsRepository.hasConsent.mockResolvedValue(true);
      mockRepository.findByUserId.mockResolvedValue(mockProfile);
      const avatarUpdatedAt = new Date("2024-06-01T00:00:00Z");
      mockRepository.update.mockResolvedValue({
        ...mockProfile,
        avatarUpdatedAt,
      });
      service = createService({ mockRepository, mockConsentLogsRepository });

      const result = await service.setAvatarUpdatedAt({
        userId: mockProfile.userId,
        avatarUpdatedAt,
      });

      expect(result.avatarUpdatedAt).toEqual(avatarUpdatedAt);
      expect(mockRepository.update).toHaveBeenCalledWith({
        id: mockProfile.id,
        avatarUpdatedAt,
      });
    });

    it("throws when consent has not been granted", async () => {
      const mockRepository = createMockRepository();
      const mockConsentLogsRepository = createMockConsentLogsRepository();
      mockConsentLogsRepository.hasConsent.mockResolvedValue(false);
      service = createService({ mockRepository, mockConsentLogsRepository });

      await expect(
        service.setAvatarUpdatedAt({
          userId: mockProfile.userId,
          avatarUpdatedAt: new Date(),
        }),
      ).rejects.toThrow(
        "Consentimento para armazenar conteúdo do perfil não foi concedido",
      );
    });
  });

  describe("clearAvatar", () => {
    it("sets avatarUpdatedAt back to null", async () => {
      const mockRepository = createMockRepository();
      const mockConsentLogsRepository = createMockConsentLogsRepository();
      mockConsentLogsRepository.hasConsent.mockResolvedValue(true);
      mockRepository.findByUserId.mockResolvedValue({
        ...mockProfile,
        avatarUpdatedAt: new Date("2024-06-01T00:00:00Z"),
      });
      mockRepository.update.mockResolvedValue({
        ...mockProfile,
        avatarUpdatedAt: null,
      });
      service = createService({ mockRepository, mockConsentLogsRepository });

      const result = await service.clearAvatar({ userId: mockProfile.userId });

      expect(result.avatarUpdatedAt).toBeNull();
      expect(mockRepository.update).toHaveBeenCalledWith({
        id: mockProfile.id,
        avatarUpdatedAt: null,
      });
    });
  });
```

- [ ] **Step 3: Run the tests to confirm they fail**

Run: `cd apps/api && bunx vitest run src/modules/users/services/profile.v1.service.test.ts`
Expected: FAIL — `service.setAvatarUpdatedAt is not a function` (and TS errors on the removed `pictureUrl` fixture, which Step 1 already resolved; if any `pictureUrl` reference remains, the file won't compile — double check before moving on).

- [ ] **Step 4: Implement the service changes**

In `apps/api/src/modules/users/services/profile.v1.service.ts`:

Delete the constant `MAX_PICTURE_URL_LENGTH` (line 18) and the whole `validatePictureUrl` method (lines 95–114).

In `sanitizeAndValidate`, delete this block:

```ts
    if (params.pictureUrl !== undefined) {
      this.validatePictureUrl(params.pictureUrl);
      sanitized.pictureUrl = params.pictureUrl?.trim() || null;
    }
```

In `createProfile`, delete `pictureUrl: params.pictureUrl?.trim() || null,` from `sanitizedParams`, and delete the line `this.validatePictureUrl(sanitizedParams.pictureUrl);`.

Add these two methods to the class, right after `updateProfile`:

```ts
  async setAvatarUpdatedAt({
    userId,
    avatarUpdatedAt,
  }: {
    userId: string;
    avatarUpdatedAt: Date;
  }): Promise<Profile> {
    const profile = await this.assertProfileEditable({ userId });
    return await this.repository.update({ id: profile.id, avatarUpdatedAt });
  }

  async clearAvatar({ userId }: { userId: string }): Promise<Profile> {
    const profile = await this.assertProfileEditable({ userId });
    return await this.repository.update({
      id: profile.id,
      avatarUpdatedAt: null,
    });
  }
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `cd apps/api && bunx vitest run src/modules/users/services/profile.v1.service.test.ts`
Expected: PASS — all tests, including the 3 new ones.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/users/services/profile.v1.service.ts apps/api/src/modules/users/services/profile.v1.service.test.ts
git commit -m "feat(api): replace pictureUrl validation with avatarUpdatedAt tracking in ProfileServiceV1"
```

---

### Task 5: Update the profile API schemas (`pictureUrl` → `avatarUrl`)

`avatarUrl` is a server-computed, read-only field — it must appear in the *output* schemas only (`fullProfileSchema`, and therefore every response schema built from it), never in the create/update body schemas.

**Files:**
- Modify: `apps/api/src/modules/users/schemas/v1/profiles.v1.common.schema.ts`

**Interfaces:**
- Produces: `fullProfileSchema` (and `profileSchema`) with `avatarUrl: string | null` instead of `pictureUrl`, consumed by the controller in Task 8 for response typing/validation.

- [ ] **Step 1: Remove `pictureUrlSchema` and replace its output usages**

Delete the `pictureUrlSchema` static (lines 40–50).

In `fullProfileSchema`, replace `pictureUrl: this.pictureUrlSchema,` with:

```ts
      avatarUrl: z
        .string()
        .url()
        .nullable()
        .openapi({
          description: "URL assinada (temporária) da foto de perfil",
          example: "https://bucket.example.railway.app/avatars/...",
        }),
```

In `profileSchema`, replace `pictureUrl: this.pictureUrlSchema,` the same way (same `avatarUrl` field).

- [ ] **Step 2: Remove `pictureUrl` from the write-body schemas**

Delete `pictureUrl: this.pictureUrlSchema,` from `createProfileBodySchema` and from `updateAuthenticatedProfileBodySchema`. Do not add `avatarUrl` to either — these bodies never accept it.

- [ ] **Step 3: Typecheck this file in isolation**

Run: `cd apps/api && bunx tsc --noEmit -p . 2>&1 | grep "profiles.v1.common.schema.ts"`
Expected: no output (no errors originating from this file). Errors from other files (controller, service) are expected until Task 8 — ignore them here.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/users/schemas/v1/profiles.v1.common.schema.ts
git commit -m "feat(api): expose avatarUrl instead of pictureUrl in profile schemas"
```

---

### Task 6: Redis-backed presigned URL cache

Isolate the "on-demand, no duplicate signing" caching logic in its own small class so `S3Service` (Task 7) stays focused on S3 I/O. Cache key includes both `userId` and the avatar's `avatarUpdatedAt` (as epoch ms) — a re-upload changes the key automatically, so there's never a stale cache entry to manually invalidate; old entries simply age out via TTL.

**Files:**
- Create: `apps/api/src/infrastructure/s3/avatar-presign-cache.ts`
- Test: `apps/api/src/infrastructure/s3/avatar-presign-cache.test.ts`

**Interfaces:**
- Consumes: `redis` from `../redis/index.ts` (existing `Bun.RedisClient` instance).
- Produces: `class AvatarPresignCache` with `get({ userId, avatarUpdatedAtMs }): Promise<string | null>` and `set({ userId, avatarUpdatedAtMs, url, ttlSeconds }): Promise<void>`, consumed by `S3Service` in Task 7.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/infrastructure/s3/avatar-presign-cache.test.ts`:

```ts
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
  const cache = new AvatarPresignCache();

  beforeEach(() => {
    get.mockReset();
    set.mockReset();
  });

  it("reads a cached url by userId and avatar version", async () => {
    get.mockResolvedValue("https://cached.example/avatar.webp");

    const url = await cache.get({ userId: "user-1", avatarUpdatedAtMs: 1000 });

    expect(url).toBe("https://cached.example/avatar.webp");
    expect(get).toHaveBeenCalledWith("avatar-presigned-url:user-1:1000");
  });

  it("returns null when there is no cache entry", async () => {
    get.mockResolvedValue(null);

    const url = await cache.get({ userId: "user-1", avatarUpdatedAtMs: 1000 });

    expect(url).toBeNull();
  });

  it("stores the url with an expiry derived from the ttl", async () => {
    set.mockResolvedValue("OK");

    await cache.set({
      userId: "user-1",
      avatarUpdatedAtMs: 1000,
      url: "https://signed.example/avatar.webp",
      ttlSeconds: 3300,
    });

    expect(set).toHaveBeenCalledWith(
      "avatar-presigned-url:user-1:1000",
      "https://signed.example/avatar.webp",
      "EX",
      3300,
    );
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd apps/api && bunx vitest run src/infrastructure/s3/avatar-presign-cache.test.ts`
Expected: FAIL — `Cannot find module './avatar-presign-cache.ts'`.

- [ ] **Step 3: Implement**

Create `apps/api/src/infrastructure/s3/avatar-presign-cache.ts`:

```ts
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
  private readonly redis: typeof redis;

  constructor({ redisClient }: { redisClient?: typeof redis } = {}) {
    this.redis = redisClient ?? redis;
  }

  async get({
    userId,
    avatarUpdatedAtMs,
  }: {
    userId: string;
    avatarUpdatedAtMs: number;
  }): Promise<string | null> {
    return await this.redis.get(buildCacheKey({ userId, avatarUpdatedAtMs }));
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
    await this.redis.set(
      buildCacheKey({ userId, avatarUpdatedAtMs }),
      url,
      "EX",
      ttlSeconds,
    );
  }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `cd apps/api && bunx vitest run src/infrastructure/s3/avatar-presign-cache.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/infrastructure/s3/avatar-presign-cache.ts apps/api/src/infrastructure/s3/avatar-presign-cache.test.ts
git commit -m "feat(api): add Redis-backed presigned avatar URL cache"
```

---

### Task 7: Version-scoped `avatarPath` + `S3Service.getAvatarUrl`

**Files:**
- Modify: `apps/api/src/infrastructure/s3/index.ts`
- Modify: `apps/api/src/infrastructure/s3/s3.service.ts`
- Test: `apps/api/src/infrastructure/s3/s3.service.test.ts`

**Interfaces:**
- Consumes: `AvatarPresignCache` from Task 6.
- Produces: `S3Service.uploadAvatarWebp({ userId, avatarUpdatedAt, bytes }): Promise<void>`, `S3Service.destroyAvatar({ userId, avatarUpdatedAt }): Promise<void>`, `S3Service.getAvatarUrl({ userId, avatarUpdatedAt }): Promise<string | null>`, `AVATAR_PRESIGN_EXPIRES_IN_SECONDS: number` — all consumed by the controller in Task 8.

- [ ] **Step 1: Update `avatarPath` to be version-scoped**

In `apps/api/src/infrastructure/s3/index.ts`, replace:

```ts
export function avatarPath(userId: string): string {
  return `avatars/${userId}`;
}
```

with:

```ts
export function avatarPath({
  userId,
  avatarUpdatedAt,
}: {
  userId: string;
  avatarUpdatedAt: Date;
}): string {
  return `avatars/${userId}/${avatarUpdatedAt.getTime()}.webp`;
}
```

- [ ] **Step 2: Write the failing test for `S3Service`**

Create `apps/api/src/infrastructure/s3/s3.service.test.ts`:

```ts
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

vi.mock("./avatar-presign-cache.ts", () => ({
  AvatarPresignCache: vi.fn().mockImplementation(() => ({
    get: cacheGet,
    set: cacheSet,
  })),
}));

import { AVATAR_PRESIGN_EXPIRES_IN_SECONDS, S3Service } from "./s3.service.ts";

describe("S3Service", () => {
  let service: S3Service;
  const avatarUpdatedAt = new Date("2024-01-01T00:00:00Z");
  const path = "avatars/user-1/1704067200000.webp";

  beforeEach(() => {
    write.mockReset();
    destroy.mockReset();
    presign.mockReset();
    cacheGet.mockReset();
    cacheSet.mockReset();
    service = new S3Service();
  });

  it("uploads webp bytes to the versioned avatar path", async () => {
    write.mockResolvedValue(undefined);

    await service.uploadAvatarWebp({
      userId: "user-1",
      avatarUpdatedAt,
      bytes: Buffer.from([1, 2, 3]),
    });

    expect(write).toHaveBeenCalledWith(path, Buffer.from([1, 2, 3]), {
      type: "image/webp",
    });
  });

  it("throws InternalServerError when the upload fails", async () => {
    write.mockRejectedValue(new Error("boom"));

    await expect(
      service.uploadAvatarWebp({
        userId: "user-1",
        avatarUpdatedAt,
        bytes: Buffer.from([1]),
      }),
    ).rejects.toThrow("Failed to upload avatar to S3");
  });

  it("deletes the versioned avatar object", async () => {
    destroy.mockResolvedValue(undefined);

    await service.destroyAvatar({ userId: "user-1", avatarUpdatedAt });

    expect(destroy).toHaveBeenCalledWith(path);
  });

  it("returns null when there is no avatar", async () => {
    const url = await service.getAvatarUrl({
      userId: "user-1",
      avatarUpdatedAt: null,
    });

    expect(url).toBeNull();
    expect(presign).not.toHaveBeenCalled();
  });

  it("returns the cached url without re-signing", async () => {
    cacheGet.mockResolvedValue("https://cached.example/avatar.webp");

    const url = await service.getAvatarUrl({ userId: "user-1", avatarUpdatedAt });

    expect(url).toBe("https://cached.example/avatar.webp");
    expect(presign).not.toHaveBeenCalled();
  });

  it("signs and caches a fresh url on a cache miss", async () => {
    cacheGet.mockResolvedValue(null);
    presign.mockReturnValue("https://signed.example/avatar.webp");

    const url = await service.getAvatarUrl({ userId: "user-1", avatarUpdatedAt });

    expect(url).toBe("https://signed.example/avatar.webp");
    expect(presign).toHaveBeenCalledWith(path, {
      expiresIn: AVATAR_PRESIGN_EXPIRES_IN_SECONDS,
      method: "GET",
    });
    expect(cacheSet).toHaveBeenCalledWith({
      userId: "user-1",
      avatarUpdatedAtMs: avatarUpdatedAt.getTime(),
      url: "https://signed.example/avatar.webp",
      ttlSeconds: AVATAR_PRESIGN_EXPIRES_IN_SECONDS - 300,
    });
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `cd apps/api && bunx vitest run src/infrastructure/s3/s3.service.test.ts`
Expected: FAIL — `uploadAvatarWebp` today takes `{ userId, bytes }` (no `avatarUpdatedAt`) and there is no `getAvatarUrl` or `AVATAR_PRESIGN_EXPIRES_IN_SECONDS` export yet.

- [ ] **Step 4: Implement**

Replace the full contents of `apps/api/src/infrastructure/s3/s3.service.ts` with:

```ts
import { InternalServerError } from "@/utils/app/errors/index.ts";
import { avatarPath, s3 } from "./index";
import { AvatarPresignCache } from "./avatar-presign-cache.ts";

export const AVATAR_PRESIGN_EXPIRES_IN_SECONDS = 3600;
const AVATAR_URL_CACHE_TTL_SECONDS = AVATAR_PRESIGN_EXPIRES_IN_SECONDS - 300;

export class S3Service {
  private readonly cache: AvatarPresignCache;

  constructor({ cache }: { cache?: AvatarPresignCache } = {}) {
    this.cache = cache ?? new AvatarPresignCache();
  }

  async uploadAvatarWebp({
    userId,
    avatarUpdatedAt,
    bytes,
  }: {
    userId: string;
    avatarUpdatedAt: Date;
    bytes: Buffer;
  }): Promise<void> {
    await s3
      .write(avatarPath({ userId, avatarUpdatedAt }), bytes, {
        type: "image/webp",
      })
      .catch(() => {
        throw new InternalServerError("Failed to upload avatar to S3");
      });
  }

  async destroyAvatar({
    userId,
    avatarUpdatedAt,
  }: {
    userId: string;
    avatarUpdatedAt: Date;
  }): Promise<void> {
    await s3.delete(avatarPath({ userId, avatarUpdatedAt })).catch(() => {
      throw new InternalServerError("Failed to delete avatar from S3");
    });
  }

  async getAvatarUrl({
    userId,
    avatarUpdatedAt,
  }: {
    userId: string;
    avatarUpdatedAt: Date | null;
  }): Promise<string | null> {
    if (!avatarUpdatedAt) return null;

    const avatarUpdatedAtMs = avatarUpdatedAt.getTime();
    const cached = await this.cache.get({ userId, avatarUpdatedAtMs });
    if (cached) return cached;

    const url = s3.presign(avatarPath({ userId, avatarUpdatedAt }), {
      expiresIn: AVATAR_PRESIGN_EXPIRES_IN_SECONDS,
      method: "GET",
    });

    await this.cache.set({
      userId,
      avatarUpdatedAtMs,
      url,
      ttlSeconds: AVATAR_URL_CACHE_TTL_SECONDS,
    });

    return url;
  }
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd apps/api && bunx vitest run src/infrastructure/s3/s3.service.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/infrastructure/s3/index.ts apps/api/src/infrastructure/s3/s3.service.ts apps/api/src/infrastructure/s3/s3.service.test.ts
git commit -m "feat(api): version-scoped avatar keys + cached on-demand presigned URLs"
```

---

### Task 8: Wire the controller — WEBP conversion, versioned S3 calls, `avatarUrl` in every response

Replaces `CloudinaryService` with `S3Service` across the controller, runs uploads through `convertAvatarToWebp`, and makes every profile-returning action include the computed `avatarUrl`. Per the Global Constraints, this codebase does not unit-test controllers — verification here is typecheck + a manual run against the dev server (Step 6/7).

**Files:**
- Modify: `apps/api/src/modules/users/controllers/profile.v1.controller.ts`

**Interfaces:**
- Consumes: `convertAvatarToWebp` (Task 2), `Profile` with `avatarUpdatedAt` (Task 3), `ProfileServiceV1.setAvatarUpdatedAt`/`clearAvatar` (Task 4), `S3Service.uploadAvatarWebp`/`destroyAvatar`/`getAvatarUrl` (Task 7).

- [ ] **Step 1: Replace the imports and constructor**

Replace:

```ts
import type { Context } from "hono";
import { CloudinaryService } from "@/infrastructure/cloudinary/cloudinary.service.ts";
import type { Session } from "@/modules/auth/repositories/auth.types.repository";
import { BadRequestError, NotFoundError } from "@/utils/app/errors/index";
import { SuccessViewModel } from "@/view-models/default/success.view-model";
import { ProfileServiceV1 } from "../services/profile.v1.service";
import { assertValidAvatar } from "../utils/avatar-validation.ts";

export class ProfileControllerV1 {
  private readonly service: ProfileServiceV1;
  private readonly cloudinary: CloudinaryService;

  constructor({
    service,
    cloudinary,
  }: { service?: ProfileServiceV1; cloudinary?: CloudinaryService } = {}) {
    this.service = service ?? new ProfileServiceV1();
    this.cloudinary = cloudinary ?? new CloudinaryService();
  }
```

with:

```ts
import { logger } from "@versum/logger";
import type { Context } from "hono";
import { S3Service } from "@/infrastructure/s3/s3.service.ts";
import type { Session } from "@/modules/auth/repositories/auth.types.repository";
import { BadRequestError, NotFoundError } from "@/utils/app/errors/index";
import { SuccessViewModel } from "@/view-models/default/success.view-model";
import type { Profile } from "../repositories/profile.types.repository";
import { ProfileServiceV1 } from "../services/profile.v1.service";
import { assertValidAvatar } from "../utils/avatar-validation.ts";
import { convertAvatarToWebp } from "../utils/avatar-image.ts";

export class ProfileControllerV1 {
  private readonly service: ProfileServiceV1;
  private readonly s3: S3Service;

  constructor({
    service,
    s3,
  }: { service?: ProfileServiceV1; s3?: S3Service } = {}) {
    this.service = service ?? new ProfileServiceV1();
    this.s3 = s3 ?? new S3Service();
  }

  private async toProfileResponse(profile: Profile) {
    const avatarUrl = await this.s3.getAvatarUrl({
      userId: profile.userId,
      avatarUpdatedAt: profile.avatarUpdatedAt,
    });
    return { ...profile, avatarUrl };
  }
```

- [ ] **Step 2: Attach `avatarUrl` to the read/write actions**

In `createProfile`, `getAuthenticatedProfile`, `updateAuthenticatedProfile`, and `getProfileByUsername`, replace `data: profile,` with `data: await this.toProfileResponse(profile),` in each `SuccessViewModel.create({...})` call.

- [ ] **Step 3: Rewrite `uploadAvatar`**

Replace the whole `uploadAvatar` method with:

```ts
  uploadAvatar = async (c: Context) => {
    const session = c.get("session") as Session;

    const body = await c.req.parseBody();
    const file = body.file;

    if (!(file instanceof File)) {
      throw new BadRequestError("Avatar file is required");
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    assertValidAvatar({ mimeType: file.type, size: file.size, bytes });

    const existingProfile = await this.service.assertProfileEditable({
      userId: session.userId,
    });

    const webpBytes = await convertAvatarToWebp(bytes);
    const avatarUpdatedAt = new Date();

    await this.s3.uploadAvatarWebp({
      userId: session.userId,
      avatarUpdatedAt,
      bytes: webpBytes,
    });

    const profile = await this.service.setAvatarUpdatedAt({
      userId: session.userId,
      avatarUpdatedAt,
    });

    if (existingProfile.avatarUpdatedAt) {
      this.s3
        .destroyAvatar({
          userId: session.userId,
          avatarUpdatedAt: existingProfile.avatarUpdatedAt,
        })
        .catch((error) => {
          logger(
            { level: "warn" },
            "[S3]",
            `Failed to remove previous avatar for user ${session.userId}: ${
              error instanceof Error ? error.message : error
            }`,
          );
        });
    }

    return c.json(
      SuccessViewModel.create({
        data: await this.toProfileResponse(profile),
        message: "Avatar updated",
        code: "AVATAR_UPDATED",
      }),
      200,
    );
  };
```

- [ ] **Step 4: Rewrite `deleteAvatar`**

Replace the whole `deleteAvatar` method with:

```ts
  deleteAvatar = async (c: Context) => {
    const session = c.get("session") as Session;

    const existingProfile = await this.service.assertProfileEditable({
      userId: session.userId,
    });

    if (existingProfile.avatarUpdatedAt) {
      await this.s3.destroyAvatar({
        userId: session.userId,
        avatarUpdatedAt: existingProfile.avatarUpdatedAt,
      });
    }

    const profile = await this.service.clearAvatar({
      userId: session.userId,
    });

    return c.json(
      SuccessViewModel.create({
        data: await this.toProfileResponse(profile),
        message: "Avatar removed",
        code: "AVATAR_REMOVED",
      }),
      200,
    );
  };
```

- [ ] **Step 5: Typecheck**

Run: `cd apps/api && bun run typecheck 2>&1 | grep -i "profile.v1.controller\|profile.v1.common.schema"`
Expected: no output — no remaining errors in these two files. (Errors in `cloudinary/*` are expected and resolved in Task 9.)

- [ ] **Step 6: Manual verification against the dev server**

Run: `cd apps/api && bun run dev` (leave running), then in another shell:

```bash
curl -s -X POST http://localhost:3000/v1/users/me/avatar \
  -H "Cookie: <a-valid-session-cookie>" \
  -F "file=@/path/to/a/real/photo.jpg"
```

Expected: JSON response with `success: true`, `data.avatarUrl` set to an `https://` URL, `data.avatarUpdatedAt` set. Then:

```bash
curl -s http://localhost:3000/v1/users/me
```

Expected: same `avatarUrl` value (served from the Redis cache — no visible delay/re-signing). Then:

```bash
curl -s -X DELETE http://localhost:3000/v1/users/me/avatar \
  -H "Cookie: <a-valid-session-cookie>"
```

Expected: `data.avatarUrl: null`.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/users/controllers/profile.v1.controller.ts
git commit -m "feat(api): serve avatars from S3 with WEBP conversion and cached presigned URLs"
```

---

### Task 9: Remove Cloudinary entirely, final full-suite verification

**Files:**
- Delete: `apps/api/src/infrastructure/cloudinary/cloudinary.service.ts`, `apps/api/src/infrastructure/cloudinary/cloudinary.service.test.ts`, `apps/api/src/infrastructure/cloudinary/index.ts`
- Modify: `apps/api/package.json` (remove `cloudinary` dependency)

- [ ] **Step 1: Delete the Cloudinary infrastructure directory**

Run: `rm -rf apps/api/src/infrastructure/cloudinary`

- [ ] **Step 2: Remove the `cloudinary` dependency**

Run: `cd apps/api && bun remove cloudinary`
Expected: `package.json` no longer lists `cloudinary`; `bun.lock` updates.

- [ ] **Step 3: Confirm no remaining references**

Run: `grep -ril cloudinary apps/api/src`
Expected: no output.

- [ ] **Step 4: Full verification — typecheck, lint, tests**

Run: `cd apps/api && bun run typecheck && bun run lint && bun run test`
Expected: all three PASS with zero errors/failures.

- [ ] **Step 5: Commit**

```bash
git add -A apps/api/src/infrastructure apps/api/package.json apps/api/bun.lock
git commit -m "chore(api): remove Cloudinary infrastructure and dependency"
```

---

## Self-Review Notes

- **Spec coverage:** presign-on-demand ✅ (Task 7 `getAvatarUrl`), no duplicate signing ✅ (Redis cache, Task 6), `pictureUrl` removed from the `profiles` table and replaced by `avatarUpdatedAt` ✅ (Task 3), WEBP conversion + output validation ✅ (Task 2), broken test baseline fixed before building on top of it ✅ (Task 1), Cloudinary fully removed ✅ (Task 9).
- **Type consistency:** `avatarPath({ userId, avatarUpdatedAt })`, `S3Service.uploadAvatarWebp({ userId, avatarUpdatedAt, bytes })`, `S3Service.destroyAvatar({ userId, avatarUpdatedAt })`, `S3Service.getAvatarUrl({ userId, avatarUpdatedAt })` — the same three-shape signature is used consistently from Task 7 through Task 8.
- **No placeholders:** every step has runnable code or an exact command with expected output.
