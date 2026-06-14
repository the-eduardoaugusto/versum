@../AGENTS.md

# API — Specific Context

Stack: Bun + Hono + OpenAPIHono (Zod OpenAPI) + Drizzle ORM (PostgreSQL) + Resend (email) + httpOnly cookie auth

## Module Structure
```
<name>/
├── controllers/  # HTTP handlers (Hono Context)
├── db/           # Drizzle schemas + relations
├── repositories/ # DB access
├── routes/       # OpenAPI route definitions
├── schemas/      # Zod OpenAPI schemas
└── services/     # Business logic
```

## Conventions
- Files: `<name>.v1.<type>.ts` (e.g. `auth.v1.controller.ts`)
- Responses: always `SuccessViewModel.create()`
- Errors: classes from `utils/app/errors/` (BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError)
- Cross-module imports: `@/` alias
- Local imports: relative, no `.ts`
