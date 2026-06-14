# Versum API

Runtime: Bun | Framework: Hono + OpenAPIHono | ORM: Drizzle (PostgreSQL) | Docs: `/docs`

## Commands
```bash
bun run src/index.ts   # start server
bun run cli            # CLI (Bible seed, DB ops, OpenAPI docs, build zip)
bun run lint           # Biome check
bun run typecheck      # tsc --noEmit
```

## Env
```env
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3000
```

## Auth Flow
1. `POST /api/v1/auth/magic-link` — request link (email sent via Resend)
2. `GET /api/v1/auth/magic-link?token=...` — validate + create session
3. Session: `__Host-session` cookie (httpOnly)

## Key Endpoints
| Method | Path | Auth | Desc |
|--------|------|------|------|
| GET | `/api/v1/public/bible/books` | No | List books |
| GET | `/api/v1/public/bible/books/{id}/chapters/{n}/verses` | No | List verses |
| POST | `/api/v1/auth/magic-link` | No | Request magic link |
| GET | `/api/v1/auth/magic-link` | No | Validate token |
| POST | `/api/v1/auth/logout` | Cookie | Logout |
| GET | `/api/v1/users/@me` | Cookie | Get current user |
| PATCH | `/api/v1/users/@me` | Cookie | Update user |
| GET | `/api/v1/users/{username}` | No | Get public user |

## Core Schemas
- User: `id(uuid)`, `username`, `name`, `email`, `bio?`, `pictureUrl?`, `createdAt`
- Book: `id(uuid)`, `name`, `slug`, `niceName`, `testament(OLD|NEW)`, `totalChapters`
- Pagination: `currentPage`, `totalPages`, `totalItems`, `itemsPerPage`, `hasNextPage`, `hasPrevPage`
- All responses: `SuccessViewModel.create(data, pagination?)` — camelCase
