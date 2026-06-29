---
title: "API"
section: "Docs"
subsection: "Apps"
tags: [versum, app, api, backend]
up: "[[Docs/Apps/_Index]]"
related: ["[[Docs/API Development]]", "[[Docs/Naming Convention]]", "[[Rules/02 Scalability]]"]
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
apps/api/src/
├── modules/              # Módulos de feature
│   ├── auth/
│   ├── bible/
│   ├── reading/
│   ├── users/
│   ├── interactions/
│   └── consent-logs/
├── middlewares/          # Middlewares
│   ├── auth.middleware
│   ├── consent.middleware
│   ├── rate-limiter/
│   ├── cache-reqs/
│   └── debug-requests.middleware
├── infrastructure/       # Integrações externas
│   ├── db/              # Drizzle, schemas, migrações
│   ├── cloudinary/      # Upload de imagens
│   ├── redis/           # Cache
│   └── resend/          # Email
├── view-models/         # Envelopes de resposta
│   ├── base.view-model
│   └── default/
├── utils/               # Utilitários organizados
│   ├── app/
│   ├── crypto/
│   ├── env/
│   └── pagination/
├── cli/                 # CLI tools
├── assets/              # Arquivos estáticos
├── server.ts            # Entrypoint Hono
└── test-setup.ts
```

## Camadas de Arquitetura

### Módulos
Cada módulo encapsula uma feature (auth, bible, reading, users). Estrutura interna:
```
modules/<feature>/
├── controllers/    # Handlers HTTP
├── routes/         # Definição de rotas
├── services/       # Lógica de negócio
├── repositories/   # Acesso a dados
├── schemas/        # Validação Zod
├── db/             # Queries, tipos DB
└── helpers/        # Utilitários
```

### Middlewares
- **auth.middleware** — Validação de sessão, magic link
- **consent.middleware** — Validação de consentimento LGPD
- **rate-limiter** — Proteção contra abuso
- **cache-reqs** — Cache de requests
- **debug-requests** — Logging de desenvolvimento

### Infrastructure
- **db/** — Drizzle ORM, schemas, migrações PostgreSQL
- **cloudinary/** — Upload e otimização de imagens
- **redis/** — Cache distribuído
- **resend/** — Envio de emails

### View-Models
Envelopes de resposta padronizados:
```typescript
{
  success: boolean
  message: string     // obrigatório
  code: string        // obrigatório
  data?: T
  pagination?: { ... }
}
```

## Padrões Principais

- **Módulos:** `<nome>.v1.<tipo>.ts` (ex: `journey.v1.service.ts`)
- **View Models:** `SuccessViewModel.create()` para respostas
- **Convenção:** `snake_case` no DB, `camelCase` no código/respostas
- **Errors:** Validação Zod + mensagens estruturadas
- **Testes:** Colocalizados com módulos

## Próximas Seções

- [[Docs/Apps/API/Services|Services]] — módulos e serviços (auth, bible, reading, users, interactions, consent-logs)
- [[Docs/Apps/API/Database|Database]] — schemas Drizzle, migrações, relações
- [[Docs/Apps/API/CLI|CLI]] — ferramenta interativa: bible seed, truncate, build, deploy

---

◀ [[Docs/Apps/_Index|Apps]] · [[Docs/Apps/API/Services|Services]] ▶
