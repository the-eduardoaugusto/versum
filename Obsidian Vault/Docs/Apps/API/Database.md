---
title: "API — Database"
section: "Docs"
subsection: "Apps"
tags: [versum, api, database, postgresql, drizzle]
up: "[[Docs/Apps/API/_Overview]]"
related: ["[[Docs/Apps/API/Services]]", "[[Docs/Guides/Naming Convention]]"]
depth: 2
---

# 💾 API — Database

Schemas PostgreSQL, migrações e camada ORM com Drizzle.

## Tech Stack

- **Banco:** PostgreSQL
- **ORM:** Drizzle
- **Migrações:** Drizzle migrations

## Estrutura

```
apps/api/src/db/
├── schema/
│   ├── users.ts       # Tabela users
│   ├── chapters.ts    # Tabela chapters
│   └── ...
├── migrations/        # Arquivos de migração
└── index.ts           # Conexão + queries
```

## Convenções

- **Colunas:** `snake_case` (ex: `created_at`, `user_id`)
- **Drizzle props:** `camelCase` (ex: `createdAt`, `userId`)
- **PK:** `id` (UUID)
- **Timestamps:** `created_at`, `updated_at`

---

◀ [[Docs/Apps/API/Services|Services]] · [[Docs/Apps/_Index|Apps]] ▶
