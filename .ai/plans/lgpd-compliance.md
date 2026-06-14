# LGPD Compliance Plan

## Data Map
| Data | Tables | Legal Basis |
|------|--------|-------------|
| Email | `users`, `magic_links` | Art. 7º V (contract) |
| Name, username | `profiles` | Art. 7º V (contract) |
| Bio, picture URL | `profiles` | Art. 7º I (consent) |
| IP, User-Agent | `sessions`, Redis | Art. 7º IX (legitimate interest) |
| Reading behavior | `journey_readings`, `discovery_readings` | Art. 7º V (contract) |
| Annotations | `marks` | Art. 7º I (consent) |
| Likes | `likes` | Art. 7º I (consent) |

Third-party processors: Resend (email) | PostgreSQL host (all data) | Redis host (IP, transient)

## Compliance Status
Already compliant: Argon2 hashing, CSPRNG, HttpOnly cookies, HSTS, rate limiting, data minimization, session auth

## Phases

### Phase 1 — Consent Logs (done)
`consent_logs` table: `id`, `userId`, `purpose`, `granted`, `ip`, `userAgent`, `createdAt`
Repo methods: `createConsentLog` | `getConsentLogsByUserId` | `hasConsent({ userId, purpose })`

### Phase 2 — User Deletion `DELETE /api/v1/users/@me`
Manual delete order (no cascade): sessions → profiles → magic_links (by email)
Cascade (auto on user delete): `marks`, `likes`, `journey_readings`, `discovery_readings`, `consent_logs`
Confirmation: magic link re-auth or two-step token flow

### Phase 3 — Data Export `GET /api/v1/users/@me/export`
Returns: user + profile + sessions (exclude tokenHash) + readingHistory + annotations + likes + consentLogs
Service uses `Promise.all` for parallel queries

### Phase 4 — Retention/Purge
| Table | Condition | Frequency |
|-------|-----------|-----------|
| `magic_links` | `expiresAt < now-30d` AND `usedAt IS NOT NULL` | Daily |
| `magic_links` | `expiresAt < now-7d` AND `usedAt IS NULL` | Daily |
| `sessions` | `revokedAt IS NOT NULL` AND `revokedAt < now-90d` | Weekly |

### Phase 5 — Privacy Policy `GET /privacy`
Public page: `apps/client/src/app/(public)/privacy/page.tsx`
Content: data map + legal basis + third-parties + user rights (with API links) + DPO + retention + cookies

### Phase 6 — Onboarding Consent
Route: `/onboarding` → checkboxes → `POST /api/v1/consent` → profile creation
Skip if `GET /api/v1/consent` shows already consented

### Phase 7 — DPO + Breach Notification
DPO: dpo@versum.app | Discord webhook for auth alerts (failed logins, invalid tokens, 500s)

## New Routes
| Method | Path | Desc |
|--------|------|------|
| GET | `/api/v1/users/@me/export` | Export all user data |
| DELETE | `/api/v1/users/@me` | Delete account + data |
| POST | `/api/v1/consent` | Record consent |
| GET | `/api/v1/consent` | Get consent history |

## Implementation Priority
1. Consent logs (foundation)
2. DELETE /@me (legal requirement)
3. GET /@me/export (legal requirement)
4. Onboarding UI (legal requirement)
5. Privacy page
6. Purge job
7. DPO + breach notification

## Notes
- `sessions`: no cascade from `users` — manual delete required
- `profiles`: no cascade from `users` — manual delete required
- `magic_links`: tied to email (not userId) — delete by email on user deletion
