---
title: "API"
section: "Docs"
subsection: "Apps"
tags: [versum, app, api, backend]
up: "[[Docs/Apps/_Index]]"
related: ["[[Docs/Guides/API Development]]", "[[Docs/Guides/Naming Convention]]", "[[Rules/02 Scalability]]"]
depth: 1
---

# 🔌 API

Backend REST — responsável por processamento de dados, autenticação e lógica de negócio.

## Tech Stack

- **Framework:** Hono (com OpenAPIHono para tipagem)
- **ORM:** Drizzle
- **Banco:** PostgreSQL
- **Runtime:** Bun
- **Autenticação:** Magic Link + httpOnly cookie (sessão infinita)

## Arquitetura

```
apps/api/
├── src/
│   ├── modules/       # Módulos de feature (journey, users, etc.)
│   ├── services/      # Serviços reutilizáveis
│   ├── middleware/    # Middlewares (auth, error handling)
│   ├── db/            # Schemas Drizzle, migrações
│   ├── types/         # Types compartilhados
│   └── index.ts       # Entrypoint
├── tests/             # Testes colocalizados
└── package.json
```

## Padrões Principais

- **Módulos:** `<nome>.v1.<tipo>.ts` (ex: `journey.v1.service.ts`)
- **View Models:** `SuccessViewModel.create()` para respostas
- **Convenção:** `snake_case` no DB, `camelCase` no código/respostas
- **Errors:** Validação Zod + mensagens estruturadas

## Próximas Seções

- [[Docs/Apps/API/Services|Services]] — serviços principais, fluxos
- [[Docs/Apps/API/Database|Database]] — schemas, migrações, relações

---

◀ [[Docs/Apps/_Index|Apps]] · [[Docs/Apps/API/Services|Services]] ▶
