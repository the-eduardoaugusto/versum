# LGPD Next Phases

Branch: `feat/lgpd-compliance`

## Phase 3 — Data Export `GET /api/v1/users/@me/export`

Response:
```json
{
  "exportedAt": "ISO-8601",
  "user": { "email": "...", "createdAt": "..." },
  "profile": { "username", "name", "bio", "pictureUrl" },
  "sessions": [{ "createdAt", "ip", "userAgent", "expiresAt" }],
  "readingHistory": { "journey": [], "discovery": [] },
  "annotations": [], "likes": [], "consentLogs": []
}
```

Existing repos: `UserRepository.findById` | `ProfileRepository.findByUserId` | `AuthRepository.getSessionsByUserId` | `ConsentLogsRepository.getConsentLogsByUserId`

New repo methods: `JourneyReadingRepository.findByUserId` | `DiscoveryReadingRepository.findByUserId` | `MarksRepository.findByUserId` | `LikesRepository.findByUserId`

Service: `exportUserData({ userId })` → `Promise.all` → return structured JSON (no tokenHash)

Route: `GET /@me/export` | cookieAuth | register after `router.use("/@me", authMiddleware.validateSession)`

Schema: `exportUserDataResponseSchema` in `users/schemas/v1/users.v1.common.schema.ts`

Tests: exportUserData success | exportUserData user-not-found | exportUserData partial data

## Phase 4 — Onboarding Consent

Checkboxes: `profile_content` | `annotations` | `likes` | `terms` (required)
Flow: magic link auth → `/onboarding` → `POST /api/v1/consent` → profile creation
Route guard: skip if already consented (check `GET /api/v1/consent` or field in `GET /users/@me`)

Backend: `ProfileServiceV1.createProfile` → `hasConsent("profile_content")` before create

Tests: `profile.v1.service.test.ts` + 1 (createProfile blocked without consent)

## Phase 5 — Privacy Page
`apps/client/src/app/(public)/privacy/page.tsx` (static)
Content: data collected + legal basis + third-parties + user rights + DPO + retention + cookie policy

## Phase 6 — Purge Job
Service: `apps/api/src/modules/auth/services/purge.service.ts`
Methods: `purgeExpiredMagicLinks()` | `purgeExpiredSessions()` | `runDailyPurge()`
CLI: `bun run src/cli/index.ts purge --daily|--weekly`

Tests (new file `purge.service.test.ts`): purge used magic links | purge abandoned magic links | purge old sessions | runDailyPurge returns totals

## Phase 7 — DPO + Breach Notification
DPO contact in privacy page | Discord webhook alerts (multiple failed logins, invalid tokens, auth 500)

## Tests Status
| File | Count | Status |
|------|-------|--------|
| `consent-log.v1.service.test.ts` | 6 | Done |
| `user.v1.service.test.ts` | 11 (incl. delete) | Done |

## Mock Pattern
```typescript
const createMockRepository = () => ({ method: vi.fn<() => Promise<Type>>() });
service = new MyServiceV1({ repository: mockRepo as unknown as RealRepo });
expect(result).toEqual(expected);
expect(mockRepo.method).toHaveBeenCalledWith({ ... });
```
