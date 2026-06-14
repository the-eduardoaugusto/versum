# API Development

## Structure
```
apps/api/src/
├── modules/<name>/
│   ├── controllers/   # Hono handlers
│   ├── db/            # Drizzle schemas + relations
│   ├── helpers/       # Optional utils
│   ├── repositories/  # DB access
│   ├── routes/        # OpenAPI route definitions
│   ├── schemas/       # Zod OpenAPI schemas
│   └── services/      # Business logic
├── view-models/       # Response DTOs
├── middlewares/
└── infrastructure/    # db/ redis/ resend/
```

## New Module Steps
1. Create `modules/<name>/` with all subdirs
2. All files versioned: `<name>.v1.<type>.ts`
3. Schema → repo → service → Zod schemas → routes
4. Register in `src/modules/routes.ts`

## Naming
DB cols: `snake_case` | Drizzle props: `camelCase` | API: `camelCase` | Files: `auth.v1.controller.ts`

## Response Pattern
```typescript
// ALWAYS
return c.json(SuccessViewModel.create(data), 200);
return c.json(SuccessViewModel.create(data, PaginationViewModel.create({...})), 200);
// NEVER
return c.json({ profile }, 200);
return c.json({ message: "ok" }, 200);
```

## Errors
```typescript
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/utils/app/errors";
throw new NotFoundError("Profile not found"); // auto-caught by error handler
```

## OpenAPI
Update `apps/client/openapi.yaml` for every endpoint change. Descriptions in English. Props camelCase.

## Imports
- Within module: relative, no `.ts`
- Cross-module: `@/` alias

## Tests
Colocated: `auth.v1.service.test.ts` | Vitest | Mock external deps (DB, redis, email)
