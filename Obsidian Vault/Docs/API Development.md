---
title: "API Development"
section: Docs
tags: [versum, docs]
up: "[[Docs/_Index|Docs]]"
prev: "[[Naming Convention]]"
next: "[[API Response Standardization]]"
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › **API Development**

---

# API Development Guide

## Project Structure

```
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── controllers/     # Hono request handlers
│   │   ├── db/              # Drizzle schemas + relations
│   │   ├── helpers/         # (opcional) Funções auxiliares do módulo
│   │   ├── repositories/    # Acesso a banco de dados
│   │   ├── routes/          # Definição de rotas OpenAPI
│   │   ├── schemas/         # Schemas Zod OpenAPI (request/response)
│   │   └── services/        # Lógica de negócio
│   ├── bible/
│   ├── consent-logs/
│   ├── reading/
│   │   ├── routes.ts         # Roteador que monta journey
│   │   └── journey/          # Modo Jornada (leitura sequencial)
│   └── users/
├── view-models/              # Response DTOs
├── middlewares/               # Hono middlewares
└── infrastructure/
    ├── db/                   # DB config + schema central
    ├── s3/                   # Upload de imagens (Bun S3Client, Railway bucket)
    ├── redis/                # Redis client
    └── resend/               # Email provider
```

## Creating a New Module

1. Create `modules/<nome>/` com a estrutura: `controllers/`, `db/`, `repositories/`, `routes/`, `schemas/`, `services/`
2. Todos os arquivos do módulo DEVEM usar sufixo de versão: `auth.v1.controller.ts`
3. Crie Drizzle schema em `db/`
4. Crie repository em `repositories/`
5. Crie service em `services/`
6. Crie schemas Zod em `schemas/`
7. Crie routes em `routes/`
8. Registre as rotas em `src/modules/routes.ts`

## Naming Convention

**CRITICAL:** Follow [[Naming Convention]]

- Database columns: `snake_case`
- Drizzle properties: `camelCase`
- API responses: `camelCase`
- Arquivos de módulo: `<nome>.v1.<tipo>.ts` (ex: `auth.v1.controller.ts`, `bible.v1.service.ts`)

## View Models Pattern

**SEMPRE** use View Models nas respostas:

```typescript
import { SuccessViewModel } from "@/view-models/default/success.view-model";
import { PaginationViewModel } from "@/view-models/default/pagination.view-model";

return c.json(
  SuccessViewModel.create({
    data: profile,
    pagination: PaginationViewModel.create({ ... }),
    message: "Perfil atualizado",
    code: "PROFILE_UPDATED",
  }),
  200,
);
```

NUNCA retorne objetos soltos:
```typescript
// ❌ ERRADO
return c.json({ profile }, 200);
return c.json({ message: "ok" }, 200);

// ✅ CORRETO
return c.json(SuccessViewModel.create({ data: profile, message: "Perfil atualizado", code: "PROFILE_UPDATED" }), 200);
return c.json(SuccessViewModel.create({ message: "Operação concluída", code: "OK" }), 200);
```

## Error Handling

Use as classes de erro em `utils/app/errors/`:

```typescript
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  RateLimitError,
} from "@/utils/app/errors";

// Dentro do controller/service:
throw new NotFoundError("Profile not found");
throw new BadRequestError("Invalid email");
throw new UnauthorizedError("Session expired");
throw new ConflictError("Chapter does not match expected current chapter");
throw new RateLimitError("Too many requests");
```

Os erros são automaticamente capturados pelo error handler.

## OpenAPI Documentation

Update `apps/client/openapi.yaml` whenever you add/modify endpoints:

- Use Portuguese for descriptions
- Define request/response schemas
- Property names MUST be `camelCase`

## Imports

- **Dentro do módulo:** path relativo SEM extensão `.ts`
- **Fora do módulo:** `@/` alias (ex: `import { App } from "@/utils/app"`)
- **View Models:** `@/view-models/default/success.view-model`

## Setup Utilities

### `utils/app/setups/`

Bootstrap da aplicação, executado em ordem na inicialização:

| Arquivo | Função |
|---------|--------|
| `setup-plugins.ts` | CORS + registro do security scheme `cookieAuth` no OpenAPI |
| `setup-middlewares.ts` | Middlewares globais: rate-limiter + debug requests |
| `setup-routes.ts` | Registro de rotas `/api/v1/...`, `/openapi.json` e `/docs` (Scalar UI) |
| `setup-listeners.ts` | Error handler global + conexão Redis |
| `setup-cron.ts` | Job diário (03:00) para purge de magic links e sessões expiradas |

### `utils/pagination/`

```typescript
import { parsePagination } from "@/utils/pagination";

// Valida e parseia query params page/limit
// Default: page=1, limit=10, max limit=50
const { page, limit } = parsePagination(c.req.query());
```

### `utils/app/schemas/`

```typescript
import { createSuccessResponseSchema } from "@/utils/app/schemas/success-response";

// Gera schema OpenAPI de resposta de sucesso com data e pagination opcionais
const myResponseSchema = createSuccessResponseSchema("MyResponse", myDataSchema, includePagination);
```

## Testes

- Colocar arquivo de teste ao lado do arquivo testado: `auth.v1.service.test.ts`
- Usar Vitest (`describe`/`it`/`expect`)
- Mockar dependências externas (banco, redis, email)


---

◀ [[Naming Convention]] · 📚 [[Docs/_Index|Docs]] · [[API Response Standardization]] ▶
