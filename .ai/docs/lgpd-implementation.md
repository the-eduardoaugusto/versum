# LGPD Implementation

## Consent Middleware
All routes processing personal data need `requireConsent`:
```typescript
// routes/<module>.v1.route.ts
router.openapi(myRoute, requireConsent("annotations"), controller.myHandler);
// Location: apps/api/src/middlewares/consent.middleware.ts
```

## Purposes
| Purpose | Used for | Required |
|---------|----------|----------|
| `profile_content` | name, username, bio, photo | No |
| `annotations` | verse annotations/bookmarks | No |
| `likes` | likes/favorites | No |
| `terms` | Terms + Privacy acceptance | Yes |

## Service Pattern
```typescript
const hasConsent = await this.consentLogsRepository.hasConsent({ userId, purpose: "annotations" });
if (!hasConsent) throw new ForbiddenError("Consent not granted for annotations");
// ... business logic
```

## Defense in Depth
1. `requireConsent` middleware on route (fail fast)
2. Service-level `hasConsent` check (protect internal calls)

## User Deletion
Add to `deleteUser` in `user.v1.service.ts` for tables without `onDelete: cascade`:
```typescript
await this.transaction(async (tx) => {
  await this.authRepository.deleteSessionsByUserId({ userId: id }, tx);
  await this.profileRepository.deleteByUserId({ userId: id }, tx);
  await this.authRepository.deleteMagicLinksByEmail({ email: user.email }, tx);
  // ADD NEW REPOS HERE
  await this.repository.deleteUser({ id }, tx);  // cascade handles marks/likes/readings
});
```

## Data Export (Portability)
For new user data tables:
1. `users.relations.ts` — add `myFeature: many(myFeatureTable)`
2. `user.repository.ts` — add to `findByIdWithAllData`: `with: { myFeature: true }`
3. `user.v1.service.ts` — transform in `exportUserData`
4. `users.v1.common.schema.ts` — add export schema

## New Feature Checklist
- [ ] Add purpose to `CONSENT_PURPOSES` (if new)
- [ ] Add to `onboarding/constants.ts` (if new purpose)
- [ ] Service: programmatic `hasConsent` check
- [ ] Route: `requireConsent` middleware
- [ ] Manual deletion in `deleteUser` (if no cascade)
- [ ] Export in `findByIdWithAllData` + transform in service
- [ ] Export schema in `users.v1.common.schema.ts`
- [ ] Tests: consent granted, denied, no record

## Key Files
```
apps/api/src/
├── middlewares/consent.middleware.ts
├── modules/users/services/user.v1.service.ts           # deleteUser + exportUserData
├── modules/users/repositories/user.repository.ts       # findByIdWithAllData
├── modules/users/schemas/v1/users.v1.common.schema.ts
└── modules/consent-logs/repositories/consent-logs.repository.ts  # hasConsent()
apps/client/src/features/onboarding/constants.ts        # CONSENT_OPTIONS
```
