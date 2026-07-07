---
title: "Avatar S3 Migration - Design"
section: Plans
subsection: Feature Plans
tags: [versum, design, feature, s3, avatar]
up: "[[Plans/Feature Plans/_Index]]"
related: ["[[Plans/Feature Plans/Avatar S3 Migration/Implementation Plan]]", "[[Plans/Feature Plans/Profile Edit System/Design]]"]
depth: 2
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › **Avatar S3 Migration - Design**

---

# Avatar S3 Migration — Design

Date: 2026-07-06
Branch: `feat/railway-s3-migration`
Status: Approved (design)

## Goal

Finish moving profile avatar storage from Cloudinary to the Railway S3-compatible
bucket, using Bun's built-in S3 client (no `@aws-sdk/client-s3`). Serve avatars
through **on-demand presigned URLs**, signed only when actually needed and never
duplicated within their validity window, and convert every upload to WEBP
server-side.

## Existing State (do not rebuild)

- `apps/api/src/infrastructure/s3/index.ts` already configures `Bun.S3Client`
  from `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_ENDPOINT_URL` /
  `AWS_S3_BUCKET_NAME` / `AWS_DEFAULT_REGION` (already in `envSchema`).
  `S3Service` (`s3.service.ts`) has skeleton `uploadAvatarWebp`/`destroyAvatar`
  methods but no presign logic yet.
  `@aws-sdk/client-s3` was already removed from `package.json` — Bun's std lib
  `S3Client`/`RedisClient` are the only allowed S3/Redis clients.
- The Cloudinary infra (`infrastructure/cloudinary/*`) and `profiles.picture_url`
  column are still in place and still wired into `ProfileControllerV1` — this is
  the leftover half of the migration this plan finishes.
- **Known bug found during this design pass:** `src/test-setup.ts` still stubs
  `CLOUDINARY_*` env vars, but `envSchema` now requires `AWS_*` vars — the test
  suite is currently red (6 files fail) on `development`. Must be fixed first
  (Implementation Plan Task 1) before any other work.
- See [[Plans/Feature Plans/Profile Edit System/Design]] for the original
  Cloudinary-based avatar upload flow (validation, magic bytes, rate limiting) —
  those pieces (`assertValidAvatar`, upload rate limiter) are reused as-is.

## Decision: replace `pictureUrl` with `avatarUpdatedAt`

A presigned URL expires — storing it as a permanent string column (as
`pictureUrl` did for the Cloudinary `secure_url`) would go stale. Since the S3
object path can be derived deterministically from `userId`, the DB only needs
to track **whether an avatar exists and which version it is**:

`profiles.avatar_updated_at: timestamp | null` replaces `profiles.picture_url`.
`null` = no avatar (client shows a default). Non-null = avatar exists, and its
value doubles as a **version marker** for both the S3 key and the cache key.

## Decision: version-scoped S3 key, not a fixed key

Object key: `avatars/{userId}/{avatarUpdatedAt-epoch-ms}.webp` (was
`avatars/{userId}` with no version). Rationale:

- A fixed key means a re-upload overwrites the same URL. Since presigned URLs
  are cached (next decision) and eventually reused by the browser's own HTTP
  cache, a fixed key risks serving a **stale image under an unchanged URL**
  after the user updates their avatar.
- A version in the key makes every upload a new object at a new URL — cache
  busting is automatic, no manual invalidation required. Old versions are
  deleted best-effort on re-upload/delete (fire-and-forget, logged on failure,
  never blocks the request).

## Decision: on-demand presign + Redis cache (not stored, not eager)

`s3.presign(path, opts)` is a **synchronous, local HMAC signature** — it never
hits the network — so "duplication" isn't a performance problem, it's a
URL-churn problem: signing the same object twice produces two different query
strings, which defeats browser/CDN caching of the image itself.

`S3Service.getAvatarUrl({ userId, avatarUpdatedAt })`:
1. `avatarUpdatedAt === null` → return `null` immediately, never call `presign`.
2. Check `AvatarPresignCache` (Redis) by `userId:avatarUpdatedAtMs` → cache hit
   returns the same URL as last time, no new signature minted.
3. Cache miss → `s3.presign(path, { expiresIn: 3600, method: "GET" })`, cache
   it with TTL = `expiresIn - 300s` (safety margin so the cache always expires
   *before* the actual signed URL would 403).

Because the cache key embeds `avatarUpdatedAt`, a new upload naturally produces
a new cache key — no explicit invalidation step, old entries just age out.

## Decision: WEBP conversion + real validation, not trust-the-client

`assertValidAvatar` (existing) checks declared MIME + magic bytes on the
*input* bytes — cheap, but a corrupt file can still pass a magic-byte sniff.
New `avatar-image.ts` util adds:
1. Real decode via `sharp` (new dependency — no image library existed before).
   A decode failure ⇒ `BadRequestError`, not a 500 later in the S3 write.
2. Resize to 512×512, `fit: "cover"`, `position: "attention"` (same crop
   semantics as the old Cloudinary `crop:"fill",gravity:"auto"` transform).
3. Re-encode to WEBP (`quality: 80`).
4. Verify the **output** bytes are actually WEBP (RIFF/WEBP magic bytes) before
   it's ever written to S3 — belt-and-suspenders against a broken encoder path.

## API surface change

`fullProfileSchema`/`profileSchema`: `pictureUrl` (read/write) → `avatarUrl`
(read-only, server-computed, never accepted in create/update request bodies).
`avatarUpdatedAt` itself is an internal DB/version detail — it is not exposed
in the API response, only the resolved `avatarUrl`.

## Out of scope

- Any change to `assertValidAvatar`'s existing MIME whitelist / size cap
  (5 MiB; JPEG/PNG/WEBP) or to the avatar upload rate limiter — both already
  correct and unaffected by the storage backend.
- Migrating any other Cloudinary-hosted asset — this plan only covers profile
  avatars, which is the only thing Cloudinary was ever used for in this repo.

---

◀ [[Plans/Feature Plans/_Index|Feature Plans]] · ▶ [[Plans/Feature Plans/Avatar S3 Migration/Implementation Plan|Implementation Plan]]
