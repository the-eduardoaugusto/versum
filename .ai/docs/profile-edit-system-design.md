# Profile Edit System — Design

Date: 2026-06-17
Branch: `feat/user-profile`
Status: Approved (design)

## Goal

Allow the authenticated user to edit their profile (name, username, bio, avatar)
from `/@me` via **inline editing**, with focus on UI/UX, performance and security.

## Existing State (do not rebuild)

- `PATCH /api/v1/profiles/@me` already implemented + hardened: validates/sanitizes
  `name`, `username`, `bio`, `pictureUrl` (HTTPS-only, length caps, HTML-escape,
  username uniqueness). Orval hook `usePatchApiV1ProfilesMe` generated.
- `GET /api/v1/profiles/@me` returns `FullProfile`.
- Client `/@me` page is read-only (server component → `ProfileView` client component
  with GSAP). Page hard-rejects any `username !== "@me"`, so this surface is always
  the profile owner.
- UI kit: `avatar`, `button`, `card`, `field`, `input`, `label`, `separator`,
  `skeleton`, `sonner`. No `textarea`, no dialog/sheet.
- Forms: TanStack Form (`@tanstack/react-form`), shared `field-error`.
- Cloudinary creds exist in `apps/api/.env` (`CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) but **no code uses them**.

## Decision: Avatar upload = server-proxied (Plan A)

Client sends `multipart/form-data` → API validates real bytes → uploads to Cloudinary
via SDK → server persists the resulting URL.

Rationale (security > marginal perf for small avatars):
- File bytes validated (type + size + magic-bytes) before anything leaves our server.
- `pictureUrl` is set **server-side** — client can never inject an arbitrary URL.
- Cloudinary normalizes: square crop `c_fill,g_auto,w_512,h_512`, `f_auto,q_auto`,
  EXIF stripped. Deterministic `public_id = versum/avatars/<userId>` with
  `overwrite: true, invalidate: true` → stable URL, no orphan accumulation.

Hono upload pattern (per https://hono.dev/examples/file-upload):
`bodyLimit({ maxSize })` middleware + `const body = await c.req.parseBody()` then
guard `if (!(file instanceof File))` and read `await file.arrayBuffer()`.

## Backend (apps/api)

### Infrastructure
- `src/infrastructure/cloudinary/index.ts` — configure SDK from env.
- `CloudinaryService` — `uploadAvatar({ userId, bytes })` and `destroyAvatar({ userId })`.
  Upload uses `upload_stream` with the deterministic public_id + transformation above.

### Env
- Add to `src/utils/env/schema.ts`:
  `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (all `z.string()`).

### Routes (profiles module, already behind `AuthMiddleware`)
- `POST /@me/avatar` (multipart):
  1. `bodyLimit({ maxSize: 5MB })`.
  2. Dedicated rate limiter (`AvatarUploadRateLimiter`: ~10/min keyed by userId).
  3. `parseBody()` → guard `file instanceof File`.
  4. Validate MIME whitelist (`image/jpeg`, `image/png`, `image/webp`) + size.
  5. Magic-byte sniff on `arrayBuffer()` (JPEG `FF D8 FF`, PNG `89 50 4E 47`,
     WEBP `RIFF....WEBP`) — reject mismatched/declared-but-fake types.
  6. `CloudinaryService.uploadAvatar` → secure_url.
  7. `ProfileServiceV1.updateProfile({ userId, pictureUrl })` → persists + returns.
  8. Respond `SuccessViewModel.create(profile)` 200.
- `DELETE /@me/avatar`: `destroyAvatar` + `updateProfile({ pictureUrl: null })`.
- `GET /check-username/{username}`: returns `{ available: boolean }`. Excludes the
  caller's own profile (so keeping your own username reads as available). Rate-limited.
  Reuses repository `existsByUsername`. No PII leaked (boolean only).

### Service
- Reuse `ProfileServiceV1` for persistence/validation. Add a thin
  `isUsernameAvailable({ username, currentUserId })` that maps to repo `existsByUsername`.

## Frontend (apps/client) — inline editing

### New UI primitive
- `src/components/ui/textarea.tsx` — base-ui/shadcn-style, matching existing `input.tsx`.

### Profile feature
- `ProfileView` gains an edit-mode toggle (local state). Read mode unchanged; edit mode
  swaps the header/body region for `ProfileEditForm`.
- `profile-edit-form.tsx` (TanStack Form):
  - `name` (input), `username` (input + debounced availability indicator ~400ms via
    `GET /check-username`), `bio` (new textarea + char counter), avatar uploader.
  - Submit: text fields via `usePatchApiV1ProfilesMe`; avatar via new upload mutation.
  - On success → `router.refresh()` + success toast (sonner). On error → error toast.
- `avatar-uploader.tsx`: uses `avatar.tsx`, hidden file input, instant local preview via
  `URL.createObjectURL` (revoked on cleanup), client-side type/size guard before upload,
  remove-photo action (calls `DELETE /@me/avatar`).
- "Editar" button visible on `/@me` (owner guaranteed by the page).

### UX / Accessibility
- Associated `<label>`s, `aria-invalid` + `aria-describedby` on errors, focus first field
  on entering edit mode, loading/disabled states, bio char counter, keyboard-operable
  upload trigger. `prefers-reduced-motion` already respected by `ProfileView`.

### Performance
- Optimistic-friendly: instant avatar preview, debounced username check.
- Cloudinary `f_auto,q_auto` serves webp/avif. Avatar served at fixed 512² (no oversized
  payloads). Mutations invalidate only what's needed (`router.refresh`).

## Codegen
- After API changes, regenerate Orval (fetch/tanstackQuery/zod) so the client uses typed
  hooks for the new endpoints. Avatar upload (multipart) may need a hand-written fetcher
  if Orval doesn't model `multipart/form-data` — confirm during implementation.

## Testing
- API (Vitest, colocated):
  - `CloudinaryService` upload/destroy with mocked SDK.
  - Avatar controller: rejects non-File, bad MIME, oversized, fake magic-bytes; happy path
    persists server-derived URL.
  - `check-username`: available/taken, excludes own username.
- Run `biome check` + `tsc --noEmit` before commit (repo hard rule).

## Out of Scope
- Client-side image compression/cropping UI (rely on Cloudinary normalization).
- Signed direct-to-Cloudinary uploads (Plan B).
- Editing fields beyond name/username/bio/avatar.

## Security Notes
- Cookie-auth: confirm CSRF posture for the new mutating routes matches existing
  `PATCH /@me` (no regression introduced).
- Never trust client for `pictureUrl`; server is the only writer of the avatar URL.
- Fail-closed rate limiting already provided by `RateLimiterMiddleware`.
