---
title: "Profile Edit System - Implementation Plan"
section: Docs
tags: [versum, docs]
up: "[[Docs/_Index|Docs]]"
prev: "[[Profile Edit System - Design]]"
next: "[[01 Security]]"
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › **Profile Edit System - Implementation Plan**

---

# Profile Edit System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the authenticated user edit name/username/bio/avatar from `/@me` via inline editing, with a Cloudinary-backed server-proxied avatar upload.

**Architecture:** Backend adds a `CloudinaryService` (infra) plus three endpoints on the existing profiles router — `POST /@me/avatar` (multipart, server validates bytes + uploads + persists URL), `DELETE /@me/avatar`, and `GET /check-username/:username`. These are registered as plain Hono handlers on the `OpenAPIHono` router (manual validation; avoids multipart↔zod-openapi friction). Frontend adds an inline edit mode in `ProfileView`, a `ProfileEditForm` (TanStack Form), an `AvatarUploader`, a `textarea` primitive, and a hand-written typed client layer using the existing `apiFetcher` mutator.

**Tech Stack:** Hono (OpenAPIHono), Drizzle, Zod, `cloudinary` SDK, Bun, Vitest — Next.js 16, React 19, Tailwind v4, base-ui, TanStack Form + Query, sonner, GSAP.

## Global Constraints

- Bun only — never npm/yarn/pnpm. Install with `bun add`.
- DB columns `snake_case`; Drizzle props `camelCase`; API responses `camelCase` wrapped in `SuccessViewModel.create()`.
- Module files named `<name>.v1.<type>.ts`. Cross-module imports use `@/`; local imports relative, no `.ts` extension in client, **with** `.ts` extension in api (api uses explicit `.ts` per existing files).
- Components PascalCase in `src/components/ui` / feature folders. Tests colocated (`*.test.ts`).
- Every commit passes the pre-commit hook: `bun run lint && bun run typecheck && bun run test`.
- Never commit `.env`. `pictureUrl` is HTTPS-only, max 500 chars (existing schema).
- Avatar limits (exact): max **5 MiB** (`5 * 1024 * 1024`), MIME whitelist `image/jpeg`, `image/png`, `image/webp`. Cloudinary `public_id = versum/avatars/<userId>`, `overwrite: true`, `invalidate: true`, transformation `width:512,height:512,crop:"fill",gravity:"auto",quality:"auto"`.
- Avatar upload rate limit: 10 requests / 60s keyed by `user:<userId>`.

---

### Task 1: Cloudinary env + infra service

**Files:**
- Modify: `apps/api/package.json` (add `cloudinary` dependency)
- Modify: `apps/api/src/utils/env/schema.ts`
- Create: `apps/api/src/infrastructure/cloudinary/index.ts`
- Create: `apps/api/src/infrastructure/cloudinary/cloudinary.service.ts`
- Test: `apps/api/src/infrastructure/cloudinary/cloudinary.service.test.ts`

**Interfaces:**
- Produces:
  - `cloudinary` (configured v2 instance) from `infrastructure/cloudinary/index.ts`
  - `class CloudinaryService` with:
    - `uploadAvatar(params: { userId: string; bytes: Buffer }): Promise<string>` → returns `secure_url`
    - `destroyAvatar(params: { userId: string }): Promise<void>`
  - `avatarPublicId(userId: string): string` → `versum/avatars/<userId>`

- [ ] **Step 1: Install the Cloudinary SDK**

Run: `cd apps/api && bun add cloudinary`
Expected: `cloudinary` appears under `dependencies` in `apps/api/package.json`.

- [ ] **Step 2: Add Cloudinary env vars**

Modify `apps/api/src/utils/env/schema.ts` — add three keys inside the `z.object({...})`:

```ts
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
```

- [ ] **Step 3: Create the configured client**

Create `apps/api/src/infrastructure/cloudinary/index.ts`:

```ts
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/utils/env/index.ts";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export function avatarPublicId(userId: string): string {
  return `versum/avatars/${userId}`;
}
```

- [ ] **Step 4: Write the failing test**

Create `apps/api/src/infrastructure/cloudinary/cloudinary.service.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadStream = vi.fn();
const destroy = vi.fn();

vi.mock("./index.ts", () => ({
  cloudinary: { uploader: { upload_stream: uploadStream, destroy } },
  avatarPublicId: (userId: string) => `versum/avatars/${userId}`,
}));

import { CloudinaryService } from "./cloudinary.service.ts";

describe("CloudinaryService", () => {
  beforeEach(() => {
    uploadStream.mockReset();
    destroy.mockReset();
  });

  it("uploads bytes and resolves the secure_url", async () => {
    uploadStream.mockImplementation((_opts, cb) => {
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
    expect(uploadStream).toHaveBeenCalledWith(
      expect.objectContaining({ public_id: "versum/avatars/user-1", overwrite: true }),
      expect.any(Function),
    );
  });

  it("rejects when Cloudinary returns an error", async () => {
    uploadStream.mockImplementation((_opts, cb) => ({
      end: () => cb(new Error("boom"), undefined),
    }));
    const service = new CloudinaryService();
    await expect(
      service.uploadAvatar({ userId: "u", bytes: Buffer.from([1]) }),
    ).rejects.toThrow();
  });

  it("destroys by deterministic public_id", async () => {
    destroy.mockResolvedValue({ result: "ok" });
    const service = new CloudinaryService();
    await service.destroyAvatar({ userId: "user-1" });
    expect(destroy).toHaveBeenCalledWith("versum/avatars/user-1", { invalidate: true });
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd apps/api && bunx vitest run src/infrastructure/cloudinary/cloudinary.service.test.ts`
Expected: FAIL — cannot find module `./cloudinary.service.ts`.

- [ ] **Step 6: Implement CloudinaryService**

Create `apps/api/src/infrastructure/cloudinary/cloudinary.service.ts`:

```ts
import { InternalServerError } from "@/utils/app/errors/index.ts";
import { avatarPublicId, cloudinary } from "./index.ts";

export class CloudinaryService {
  uploadAvatar({ userId, bytes }: { userId: string; bytes: Buffer }): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: avatarPublicId(userId),
          overwrite: true,
          invalidate: true,
          resource_type: "image",
          transformation: [
            { width: 512, height: 512, crop: "fill", gravity: "auto", quality: "auto" },
          ],
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(new InternalServerError("Avatar upload failed"));
            return;
          }
          resolve(result.secure_url);
        },
      );
      stream.end(bytes);
    });
  }

  async destroyAvatar({ userId }: { userId: string }): Promise<void> {
    await cloudinary.uploader.destroy(avatarPublicId(userId), { invalidate: true });
  }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd apps/api && bunx vitest run src/infrastructure/cloudinary/cloudinary.service.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 8: Add the env vars to your local `.env` (manual, do not commit)**

Confirm `apps/api/.env` already contains `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (it does per design). No commit of `.env`.

- [ ] **Step 9: Commit**

```bash
git add apps/api/package.json apps/api/bun.lock apps/api/src/utils/env/schema.ts apps/api/src/infrastructure/cloudinary
git commit -m "feat(api): add Cloudinary infra service for avatar uploads"
```

---

### Task 2: Image byte-validation util

**Files:**
- Create: `apps/api/src/modules/users/utils/avatar-validation.ts`
- Test: `apps/api/src/modules/users/utils/avatar-validation.test.ts`

**Interfaces:**
- Produces:
  - `MAX_AVATAR_BYTES = 5 * 1024 * 1024`
  - `ALLOWED_AVATAR_MIME: readonly ["image/jpeg","image/png","image/webp"]`
  - `assertValidAvatar(params: { mimeType: string; size: number; bytes: Uint8Array }): void` — throws `BadRequestError` on any violation.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/users/utils/avatar-validation.test.ts`:

```ts
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
      assertValidAvatar({ mimeType: "image/jpeg", size: JPEG.length, bytes: JPEG }),
    ).not.toThrow();
  });

  it("accepts png and webp", () => {
    expect(() =>
      assertValidAvatar({ mimeType: "image/png", size: PNG.length, bytes: PNG }),
    ).not.toThrow();
    expect(() =>
      assertValidAvatar({ mimeType: "image/webp", size: WEBP.length, bytes: WEBP }),
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
      assertValidAvatar({ mimeType: "image/png", size: JPEG.length, bytes: JPEG }),
    ).toThrow(/content/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && bunx vitest run src/modules/users/utils/avatar-validation.test.ts`
Expected: FAIL — cannot find module `./avatar-validation.ts`.

- [ ] **Step 3: Implement the util**

Create `apps/api/src/modules/users/utils/avatar-validation.ts`:

```ts
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
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && bunx vitest run src/modules/users/utils/avatar-validation.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/users/utils/avatar-validation.ts apps/api/src/modules/users/utils/avatar-validation.test.ts
git commit -m "feat(api): add avatar byte/mime/size validation util"
```

---

### Task 3: `isUsernameAvailable` service method

**Files:**
- Modify: `apps/api/src/modules/users/services/profile.v1.service.ts`
- Test: `apps/api/src/modules/users/services/profile.v1.service.test.ts` (append cases)

**Interfaces:**
- Consumes: `ProfileRepository.existsByUsername`, `ProfileRepository.findByUserId` (Task 0 / existing).
- Produces: `ProfileServiceV1.isUsernameAvailable(params: { username: string; currentUserId: string }): Promise<boolean>`

- [ ] **Step 1: Write the failing test (append to existing describe block)**

Append to `apps/api/src/modules/users/services/profile.v1.service.test.ts`. Use the same repository-mock style already present in that file (a `ProfileRepository` instance with `vi.fn()` methods passed into the service constructor). Add:

```ts
describe("isUsernameAvailable", () => {
  it("returns true when the username is free", async () => {
    const repository = makeRepo({
      existsByUsername: vi.fn().mockResolvedValue({ exists: false }),
      findByUserId: vi.fn().mockResolvedValue({ id: "p1", userId: "u1" }),
    });
    const service = new ProfileServiceV1({ repository });
    await expect(
      service.isUsernameAvailable({ username: "freeone", currentUserId: "u1" }),
    ).resolves.toBe(true);
  });

  it("returns true when the username belongs to the caller", async () => {
    const repository = makeRepo({
      existsByUsername: vi.fn().mockResolvedValue({ exists: true, profileId: "p1" }),
      findByUserId: vi.fn().mockResolvedValue({ id: "p1", userId: "u1" }),
    });
    const service = new ProfileServiceV1({ repository });
    await expect(
      service.isUsernameAvailable({ username: "mine", currentUserId: "u1" }),
    ).resolves.toBe(true);
  });

  it("returns false when another profile owns the username", async () => {
    const repository = makeRepo({
      existsByUsername: vi.fn().mockResolvedValue({ exists: true, profileId: "p2" }),
      findByUserId: vi.fn().mockResolvedValue({ id: "p1", userId: "u1" }),
    });
    const service = new ProfileServiceV1({ repository });
    await expect(
      service.isUsernameAvailable({ username: "taken", currentUserId: "u1" }),
    ).resolves.toBe(false);
  });

  it("throws on invalid username format", async () => {
    const service = new ProfileServiceV1({ repository: makeRepo({}) });
    await expect(
      service.isUsernameAvailable({ username: "a b", currentUserId: "u1" }),
    ).rejects.toThrow();
  });
});
```

> If a `makeRepo` helper does not already exist in the test file, add this near the top of the file (after imports): a factory returning a partial `ProfileRepository` cast, e.g.
> ```ts
> function makeRepo(overrides: Partial<ProfileRepository>): ProfileRepository {
>   return { ...overrides } as unknown as ProfileRepository;
> }
> ```
> Match whatever mock style the existing tests use; reuse their helper if present instead of duplicating.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && bunx vitest run src/modules/users/services/profile.v1.service.test.ts -t isUsernameAvailable`
Expected: FAIL — `service.isUsernameAvailable is not a function`.

- [ ] **Step 3: Implement the method**

Add to `apps/api/src/modules/users/services/profile.v1.service.ts`, inside the `ProfileServiceV1` class (after `updateProfile`):

```ts
  async isUsernameAvailable({
    username,
    currentUserId,
  }: {
    username: string;
    currentUserId: string;
  }): Promise<boolean> {
    this.validateUsername(username);
    const normalized = username.trim().toLowerCase();

    const result = await this.repository.existsByUsername({ username: normalized });
    if (!result.exists) {
      return true;
    }

    const ownProfile = await this.repository.findByUserId({ userId: currentUserId });
    return ownProfile?.id === result.profileId;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && bunx vitest run src/modules/users/services/profile.v1.service.test.ts -t isUsernameAvailable`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/users/services/profile.v1.service.ts apps/api/src/modules/users/services/profile.v1.service.test.ts
git commit -m "feat(api): add isUsernameAvailable to profile service"
```

---

### Task 4: Avatar + check-username controllers and routes

**Files:**
- Modify: `apps/api/src/modules/users/controllers/profile.v1.controller.ts`
- Modify: `apps/api/src/modules/users/routes/profile.v1.routes.ts`
- Modify: `apps/api/src/middlewares/rate-limiter/middleware.ts` (add `AvatarUploadRateLimiter`)

**Interfaces:**
- Consumes: `CloudinaryService` (Task 1), `assertValidAvatar`/`MAX_AVATAR_BYTES` (Task 2), `ProfileServiceV1.isUsernameAvailable`/`updateProfile`/`getProfileByUserId` (existing + Task 3), `SuccessViewModel`, `bodyLimit` from `hono/body-limit`.
- Produces (plain Hono routes on the profiles router, behind `authMiddleware.validateSession`):
  - `POST /api/v1/profiles/@me/avatar` (multipart field `file`) → 200 `SuccessViewModel<FullProfile>`
  - `DELETE /api/v1/profiles/@me/avatar` → 200 `SuccessViewModel<FullProfile>`
  - `GET /api/v1/profiles/check-username/:username` → 200 `{ success: true, data: { available: boolean } }`
  - `AvatarUploadRateLimiter` (60s window, limit 10, keyed by `user:<userId>`)

- [ ] **Step 1: Add the avatar upload rate limiter**

Append to `apps/api/src/middlewares/rate-limiter/middleware.ts` (after `MagicLinkConsumeRateLimiter`):

```ts
export class AvatarUploadRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      windowMs: 60_000,
      limit: 10,
      keyGenerator: (c) => {
        const session = c.get("session") as { userId?: string } | undefined;
        if (session?.userId) return `user:${session.userId}`;
        return `ip:${getClientIp(c)}`;
      },
    });
  }
}
```

- [ ] **Step 2: Add controller methods**

Modify `apps/api/src/modules/users/controllers/profile.v1.controller.ts`.

Update imports at the top:

```ts
import { BadRequestError, NotFoundError } from "@/utils/app/errors/index";
import { CloudinaryService } from "@/infrastructure/cloudinary/cloudinary.service.ts";
import { assertValidAvatar } from "../utils/avatar-validation.ts";
```

Add a `cloudinary` field to the constructor:

```ts
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

Add these three methods inside the class:

```ts
  checkUsername = async (c: Context) => {
    const session = c.get("session") as Session;
    const username = c.req.param("username");

    if (!username) {
      throw new BadRequestError("Username is required");
    }

    const available = await this.service.isUsernameAvailable({
      username,
      currentUserId: session.userId,
    });

    return c.json(SuccessViewModel.create({ available }), 200);
  };

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

    const secureUrl = await this.cloudinary.uploadAvatar({
      userId: session.userId,
      bytes: Buffer.from(arrayBuffer),
    });

    const profile = await this.service.updateProfile({
      userId: session.userId,
      pictureUrl: secureUrl,
    });

    return c.json(SuccessViewModel.create(profile), 200);
  };

  deleteAvatar = async (c: Context) => {
    const session = c.get("session") as Session;

    await this.cloudinary.destroyAvatar({ userId: session.userId });

    const profile = await this.service.updateProfile({
      userId: session.userId,
      pictureUrl: null,
    });

    return c.json(SuccessViewModel.create(profile), 200);
  };
```

- [ ] **Step 3: Register the routes**

Modify `apps/api/src/modules/users/routes/profile.v1.routes.ts`.

Add imports at the top:

```ts
import { bodyLimit } from "hono/body-limit";
import { AvatarUploadRateLimiter } from "@/middlewares/rate-limiter/middleware.ts";
import { MAX_AVATAR_BYTES } from "../utils/avatar-validation.ts";
```

After `const authMiddleware = new AuthMiddleware();` add:

```ts
  const avatarRateLimiter = new AvatarUploadRateLimiter();
```

The existing code has `router.use("/*", authMiddleware.validateSession);` then four `router.openapi(...)` calls. **Immediately after** the `router.use("/*", ...)` line, register the avatar middlewares and the three plain routes (these run after the auth `/*` middleware because Hono executes middleware in registration order):

```ts
  router.use(
    "/@me/avatar",
    avatarRateLimiter.middleware,
    bodyLimit({ maxSize: MAX_AVATAR_BYTES }),
  );

  router.post("/@me/avatar", controller.uploadAvatar);
  router.delete("/@me/avatar", controller.deleteAvatar);
  router.get("/check-username/:username", controller.checkUsername);
```

> Note: these are intentionally plain Hono routes (not `router.openapi`) to avoid multipart↔zod-openapi friction. They are NOT added to the OpenAPI document, so the client uses the hand-written typed layer in Task 6 (not Orval).

- [ ] **Step 4: Typecheck + run existing api suite (regression gate)**

Run: `cd apps/api && bunx tsc --noEmit && bunx vitest run`
Expected: typecheck clean; all existing tests still pass (177+ from Tasks 2–3).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/users/controllers/profile.v1.controller.ts apps/api/src/modules/users/routes/profile.v1.routes.ts apps/api/src/middlewares/rate-limiter/middleware.ts
git commit -m "feat(api): add avatar upload/delete and check-username routes"
```

---

### Task 5: `Textarea` UI primitive (client)

**Files:**
- Create: `apps/client/src/components/ui/textarea.tsx`

**Interfaces:**
- Produces: `Textarea` — `React.ComponentProps<"textarea">`, base-ui styled to match `Input`.

- [ ] **Step 1: Create the component**

Create `apps/client/src/components/ui/textarea.tsx`:

```tsx
import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-20 w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
```

- [ ] **Step 2: Typecheck + lint**

Run: `cd apps/client && bunx tsc --noEmit && bunx biome check src/components/ui/textarea.tsx`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/components/ui/textarea.tsx
git commit -m "feat(client): add textarea ui primitive"
```

---

### Task 6: Client profile-edit API layer

**Files:**
- Create: `apps/client/src/features/profile/api/profile-edit.api.ts`
- Test: `apps/client/src/features/profile/api/profile-edit.api.test.ts`

**Interfaces:**
- Consumes: `apiFetcher` (default export of `@/lib/api-fetcher`), `FullProfile` type from `@/dal/orval/fetch/schemas/fullProfile`.
- Produces:
  - `checkUsername(username: string): Promise<{ available: boolean }>`
  - `uploadAvatar(file: File): Promise<FullProfile>`
  - `deleteAvatar(): Promise<FullProfile>`
  - `validateAvatarFile(file: File): string | null` — returns an error message or `null` if OK (client-side pre-check; mirrors server limits).
  - `MAX_AVATAR_BYTES = 5 * 1024 * 1024`, `ALLOWED_AVATAR_MIME` array.

- [ ] **Step 1: Write the failing test**

Create `apps/client/src/features/profile/api/profile-edit.api.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateAvatarFile, MAX_AVATAR_BYTES } from "./profile-edit.api";

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
    expect(validateAvatarFile(fakeFile("image/gif", 1000))).toMatch(/JPEG|PNG|WEBP/i);
  });

  it("rejects oversized files", () => {
    expect(validateAvatarFile(fakeFile("image/png", MAX_AVATAR_BYTES + 1))).toMatch(/5/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/client && bunx vitest run src/features/profile/api/profile-edit.api.test.ts`
Expected: FAIL — cannot find module `./profile-edit.api`.

- [ ] **Step 3: Implement the API layer**

Create `apps/client/src/features/profile/api/profile-edit.api.ts`:

```ts
import apiFetcher from "@/lib/api-fetcher";
import type { FullProfile } from "@/dal/orval/fetch/schemas/fullProfile";

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"];

type SuccessEnvelope<T> = { success: boolean; data: T };

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_MIME.includes(file.type)) {
    return "A imagem deve ser JPEG, PNG ou WEBP.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "A imagem deve ter no máximo 5 MB.";
  }
  return null;
}

export async function checkUsername(username: string): Promise<{ available: boolean }> {
  const res = await apiFetcher<SuccessEnvelope<{ available: boolean }>>(
    `/api/v1/profiles/check-username/${encodeURIComponent(username)}`,
    { method: "GET" },
  );
  return res.data;
}

export async function uploadAvatar(file: File): Promise<FullProfile> {
  const formData = new FormData();
  formData.append("file", file);
  // Do NOT set Content-Type — the browser sets the multipart boundary.
  const res = await apiFetcher<SuccessEnvelope<FullProfile>>(
    "/api/v1/profiles/@me/avatar",
    { method: "POST", body: formData },
  );
  return res.data;
}

export async function deleteAvatar(): Promise<FullProfile> {
  const res = await apiFetcher<SuccessEnvelope<FullProfile>>(
    "/api/v1/profiles/@me/avatar",
    { method: "DELETE" },
  );
  return res.data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/client && bunx vitest run src/features/profile/api/profile-edit.api.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/features/profile/api
git commit -m "feat(client): add profile-edit api layer (check-username, avatar upload/delete)"
```

---

### Task 7: `AvatarUploader` component

**Files:**
- Create: `apps/client/src/features/profile/components/avatar-uploader.tsx`

**Interfaces:**
- Consumes: `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/ui/avatar`; `Button` from `@/components/ui/button`; `validateAvatarFile` from `../api/profile-edit.api`; `toast` from `sonner`.
- Produces: `AvatarUploader` with props:
  ```ts
  interface AvatarUploaderProps {
    name: string;
    pictureUrl: string | null;
    isUploading: boolean;
    onSelectFile: (file: File) => void;
    onRemove: () => void;
  }
  ```
  (The parent owns the mutations; this component only validates + previews + delegates.)

- [ ] **Step 1: Create the component**

Create `apps/client/src/features/profile/components/avatar-uploader.tsx`:

```tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { validateAvatarFile } from "../api/profile-edit.api";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface AvatarUploaderProps {
  name: string;
  pictureUrl: string | null;
  isUploading: boolean;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
}

export function AvatarUploader({
  name,
  pictureUrl,
  isUploading,
  onSelectFile,
  onRemove,
}: AvatarUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    const error = validateAvatarFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    onSelectFile(file);
  }

  const shown = preview ?? pictureUrl ?? undefined;

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg" className="size-16">
        {shown ? (
          <AvatarImage src={shown} alt={name} />
        ) : (
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        )}
      </Avatar>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleChange}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? "Enviando..." : "Trocar foto"}
          </Button>
          {pictureUrl && !preview && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isUploading}
              onClick={onRemove}
            >
              Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPEG, PNG ou WEBP. Máx 5 MB.</p>
      </div>
    </div>
  );
}
```

> If `Button` does not support `size="sm"` / `variant` props, open `apps/client/src/components/ui/button.tsx` and use whatever variant/size names it actually exports; do not invent prop values.

- [ ] **Step 2: Typecheck + lint**

Run: `cd apps/client && bunx tsc --noEmit && bunx biome check src/features/profile/components/avatar-uploader.tsx`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/features/profile/components/avatar-uploader.tsx
git commit -m "feat(client): add avatar uploader component"
```

---

### Task 8: `ProfileEditForm` component

**Files:**
- Create: `apps/client/src/features/profile/components/profile-edit-form.tsx`

**Interfaces:**
- Consumes: `useForm` from `@tanstack/react-form`; `usePatchApiV1ProfilesMe` from `@/dal/orval/tanstackQuery/profiles/profiles`; `uploadAvatar`, `deleteAvatar`, `checkUsername` from `../api/profile-edit.api`; `Input`, `Textarea`, `Label`, `Button`, `FieldError` (from `@/components/ui/field`); `AvatarUploader` (Task 7); `toast`; `useRouter` from `next/navigation`; `FullProfile` type.
- Produces: `ProfileEditForm` with props `{ profile: FullProfile; onDone: () => void }`.

- [ ] **Step 1: Create the component**

Create `apps/client/src/features/profile/components/profile-edit-form.tsx`:

```tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePatchApiV1ProfilesMe } from "@/dal/orval/tanstackQuery/profiles/profiles";
import type { FullProfile } from "@/dal/orval/fetch/schemas/fullProfile";
import { checkUsername, deleteAvatar, uploadAvatar } from "../api/profile-edit.api";
import { AvatarUploader } from "./avatar-uploader";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const BIO_MAX = 500;

type UsernameState = "idle" | "checking" | "available" | "taken";

interface ProfileEditFormProps {
  profile: FullProfile;
  onDone: () => void;
}

export function ProfileEditForm({ profile, onDone }: ProfileEditFormProps) {
  const router = useRouter();
  const { mutateAsync: patchProfile } = usePatchApiV1ProfilesMe();

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [usernameState, setUsernameState] = useState<UsernameState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nameId = useId();
  const usernameId = useId();
  const bioId = useId();

  function scheduleUsernameCheck(value: string) {
    const next = value.trim().toLowerCase();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (next === profile.username || next.length < 3 || !USERNAME_REGEX.test(next)) {
      setUsernameState("idle");
      return;
    }

    setUsernameState("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkUsername(next);
        setUsernameState(available ? "available" : "taken");
      } catch {
        setUsernameState("idle");
      }
    }, 400);
  }

  const form = useForm({
    defaultValues: {
      name: profile.name,
      username: profile.username,
      bio: profile.bio ?? "",
    },
    async onSubmit({ value }) {
      if (usernameState === "taken") {
        toast.error("Este nome de usuário já está em uso.");
        return;
      }
      const toastId = toast.loading("Salvando perfil...");
      try {
        await patchProfile({
          data: {
            name: value.name.trim(),
            username: value.username.trim().toLowerCase(),
            bio: value.bio.trim() ? value.bio.trim() : null,
          },
        });
        toast.success("Perfil atualizado.", { id: toastId });
        router.refresh();
        onDone();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Não foi possível salvar o perfil.";
        toast.error(message, { id: toastId });
      }
    },
  });

  async function handleAvatarSelect(file: File) {
    setAvatarUploading(true);
    const toastId = toast.loading("Enviando foto...");
    try {
      await uploadAvatar(file);
      toast.success("Foto atualizada.", { id: toastId });
      router.refresh();
    } catch {
      toast.error("Não foi possível enviar a foto.", { id: toastId });
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleAvatarRemove() {
    setAvatarUploading(true);
    const toastId = toast.loading("Removendo foto...");
    try {
      await deleteAvatar();
      toast.success("Foto removida.", { id: toastId });
      router.refresh();
    } catch {
      toast.error("Não foi possível remover a foto.", { id: toastId });
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-5 px-6 py-8"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <AvatarUploader
        name={profile.name}
        pictureUrl={profile.pictureUrl ?? null}
        isUploading={avatarUploading}
        onSelectFile={handleAvatarSelect}
        onRemove={handleAvatarRemove}
      />

      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) =>
            value.trim().length === 0
              ? "Nome é obrigatório"
              : value.trim().length > 100
                ? "Nome deve ter no máximo 100 caracteres"
                : undefined,
        }}
      >
        {(field) => (
          <Field>
            <Label htmlFor={nameId}>Nome</Label>
            <Input
              id={nameId}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
            />
            <FieldError
              errors={field.state.meta.errors.map((m) => ({ message: String(m) }))}
            />
          </Field>
        )}
      </form.Field>

      <form.Field
        name="username"
        validators={{
          onChange: ({ value }) => {
            const v = value.trim();
            if (v.length < 3) return "Mínimo de 3 caracteres";
            if (v.length > 50) return "Máximo de 50 caracteres";
            if (!USERNAME_REGEX.test(v)) return "Apenas letras, números e _";
            return undefined;
          },
        }}
      >
        {(field) => (
          <Field>
            <Label htmlFor={usernameId}>Nome de usuário</Label>
            <Input
              id={usernameId}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => {
                field.handleChange(e.target.value);
                scheduleUsernameCheck(e.target.value);
              }}
              aria-invalid={
                field.state.meta.errors.length > 0 || usernameState === "taken"
              }
              aria-describedby={`${usernameId}-status`}
            />
            <p id={`${usernameId}-status`} className="text-xs text-muted-foreground">
              {usernameState === "checking" && "Verificando disponibilidade..."}
              {usernameState === "available" && "Disponível ✓"}
              {usernameState === "taken" && (
                <span className="text-destructive">Já está em uso</span>
              )}
            </p>
            <FieldError
              errors={field.state.meta.errors.map((m) => ({ message: String(m) }))}
            />
          </Field>
        )}
      </form.Field>

      <form.Field
        name="bio"
        validators={{
          onChange: ({ value }) =>
            value.length > BIO_MAX ? `Máximo de ${BIO_MAX} caracteres` : undefined,
        }}
      >
        {(field) => (
          <Field>
            <Label htmlFor={bioId}>Bio</Label>
            <Textarea
              id={bioId}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              maxLength={BIO_MAX}
              aria-invalid={field.state.meta.errors.length > 0}
            />
            <p className="text-right text-xs text-muted-foreground">
              {field.state.value.length}/{BIO_MAX}
            </p>
            <FieldError
              errors={field.state.meta.errors.map((m) => ({ message: String(m) }))}
            />
          </Field>
        )}
      </form.Field>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || usernameState === "checking"}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
```

> Verify the `Button` `variant`/`size` prop values against `apps/client/src/components/ui/button.tsx` and adjust if names differ. The `FieldError` from `@/components/ui/field` accepts `errors?: Array<{ message?: string }>` (confirmed in that file).

- [ ] **Step 2: Typecheck + lint**

Run: `cd apps/client && bunx tsc --noEmit && bunx biome check src/features/profile/components/profile-edit-form.tsx`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/features/profile/components/profile-edit-form.tsx
git commit -m "feat(client): add profile edit form with username availability + bio counter"
```

---

### Task 9: Wire inline edit mode into `ProfileView`

**Files:**
- Modify: `apps/client/src/features/profile/components/profile-view.tsx`
- Modify: `apps/client/src/features/profile/components/index.ts` (export `ProfileEditForm` if needed for tests; optional)

**Interfaces:**
- Consumes: `ProfileEditForm` (Task 8), `Button`.
- Produces: edit toggle UI; no new exported symbols required.

- [ ] **Step 1: Add edit-mode state and the Edit button**

Modify `apps/client/src/features/profile/components/profile-view.tsx`. Add imports:

```tsx
import { Button } from "@/components/ui/button";
import { ProfileEditForm } from "./profile-edit-form";
```

Inside `ProfileView`, add state:

```tsx
  const [isEditing, setIsEditing] = useState(false);
```

Replace the returned JSX body so that, when `isEditing`, the form renders instead of the header/journey; otherwise the read view renders with an "Editar" button. Concretely, change the existing `return (...)` to:

```tsx
  if (isEditing) {
    return (
      <div ref={containerRef} className="flex flex-col min-h-full">
        <ProfileEditForm profile={profile} onDone={() => setIsEditing(false)} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col min-h-full">
      <div className="flex items-start justify-between">
        <ProfileHeader profile={profile} />
        <div className="px-6 py-8">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Editar
          </Button>
        </div>
      </div>

      {journey ? (
        <JourneyProgressSection journey={journey} />
      ) : (
        <div className="px-6 pb-6">
          <p className="text-sm text-muted-foreground">
            Inicie sua jornada de leitura para ver seu progresso aqui.
          </p>
        </div>
      )}
    </div>
  );
```

> `useState` is already imported in this file. Keep the existing `useGSAP`/`prefersReducedMotion` block unchanged — it only runs animations in read mode, which is fine.

- [ ] **Step 2: Typecheck + lint the client**

Run: `cd apps/client && bunx tsc --noEmit && bunx biome check src/features/profile`
Expected: clean (biome may auto-fix import ordering; that is acceptable).

- [ ] **Step 3: Run the full client test suite (regression)**

Run: `cd apps/client && bunx vitest run`
Expected: PASS — all prior tests plus the new ones (Tasks 6) green.

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/features/profile/components/profile-view.tsx
git commit -m "feat(client): add inline edit mode to profile view"
```

---

### Task 10: Full verification + manual smoke

**Files:** none (verification only)

- [ ] **Step 1: Run the full monorepo gate**

Run (from repo root): `bun run lint && bun run typecheck && bun run test`
Expected: all three exit 0 (logger + client + api suites green).

- [ ] **Step 2: Manual smoke (requires api + client running with Cloudinary env set)**

Start api (`cd apps/api && bun run dev`) and client (`cd apps/client && bun run dev`). Log in, go to `/@me`:
1. Click "Editar" → form appears with current values.
2. Change name + bio, save → toast success, values update after refresh.
3. Type an existing username → "Já está em uso"; type a free one → "Disponível ✓".
4. Upload a JPEG/PNG/WEBP under 5 MB → avatar updates; try a `.gif` or >5 MB → client rejects with toast.
5. Remove photo → fallback initials show.

- [ ] **Step 3: Optional — regenerate Orval (only if you want the new endpoints in generated clients)**

With the api running: `cd apps/client && bunx orval`. Note: the avatar routes are not in the OpenAPI doc by design, so they will not be generated; the hand-written layer remains the source of truth. Commit any regenerated files separately if you run this.

---

## Self-Review

**Spec coverage:**
- Avatar server-proxied upload (Plan A) → Tasks 1, 2, 4, 6, 7. ✓
- Env vars added → Task 1. ✓
- Deterministic `public_id`, overwrite, normalization → Task 1 (CloudinaryService). ✓
- `POST/DELETE /@me/avatar`, magic-byte + size + mime validation, bodyLimit, rate limiter → Tasks 2, 4. ✓
- `check-username` boolean-only → Tasks 3, 4. ✓
- `isUsernameAvailable` service method → Task 3. ✓
- `textarea` primitive → Task 5. ✓
- Inline edit toggle in `ProfileView` + Editar button → Task 9. ✓
- `ProfileEditForm` (name/username debounced/bio counter/avatar) → Task 8. ✓
- `AvatarUploader` with objectURL preview + cleanup + client guard + remove → Task 7. ✓
- UX/A11y (labels, aria-invalid, aria-describedby, disabled/loading, counter) → Tasks 7, 8. ✓
- Performance (debounced check, instant preview, Cloudinary 512² normalization) → Tasks 1, 7, 8. ✓
- Testing (CloudinaryService mocked, validation util, check-username/isUsernameAvailable, client guard) → Tasks 1, 2, 3, 6. ✓
- Security note (server is only writer of pictureUrl; rate limiting; no PII in check-username) → Tasks 1, 4. ✓

**Deviation from spec (intentional):** new endpoints are plain Hono routes (not OpenAPI) to avoid multipart↔zod-openapi friction, so the client uses a hand-written typed layer instead of regenerated Orval hooks for these three endpoints. Text-field update still uses the generated `usePatchApiV1ProfilesMe`. Orval regen is optional (Task 10, Step 3). Recorded here so it is not mistaken for a gap.

**Placeholder scan:** No TBD/TODO; every code step contains full code. ✓

**Type consistency:** `uploadAvatar`/`destroyAvatar` signatures consistent across Tasks 1↔4. `isUsernameAvailable({ username, currentUserId })` consistent Tasks 3↔4. `assertValidAvatar({ mimeType, size, bytes })` consistent Tasks 2↔4. Client `checkUsername`/`uploadAvatar`/`deleteAvatar`/`validateAvatarFile` consistent Tasks 6↔7↔8. ✓


---

◀ [[Profile Edit System - Design]] · 📚 [[Docs/_Index|Docs]] · [[01 Security]] ▶
