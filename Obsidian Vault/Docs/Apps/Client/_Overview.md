---
title: "Client"
section: "Docs"
subsection: "Apps"
tags: [versum, app, client, frontend]
up: "[[Docs/Apps/_Index]]"
related: ["[[Docs/Guides/API Development]]", "[[Rules/06 Frontend Animations]]"]
depth: 1
---

# 💻 Client

Frontend — responsável por UI, state management e interação com API.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind v4
- **Components:** shadcn/ui
- **Queries:** TanStack Query (gerado via Orval)
- **Runtime:** Bun

## Arquitetura

```
apps/client/
├── src/
│   ├── app/           # App Router pages
│   ├── components/    # Componentes React
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilities
│   └── styles/        # Global styles
├── public/            # Assets estáticos
└── package.json
```

## Features

| Feature | Localização | Descrição |
|:--|:--|:--|
| **Feed/Journey** | `features/feed/journey/` | [[Docs/Apps/Client/Journey Feed Features\|Feed infinito de leitura bíblica com scroll snap]] |
| **Login** | `features/login/` | Autenticação via magic link |
| **Onboarding** | `features/onboarding/` | Fluxo de boas-vindas e setup inicial |
| **Profile** | `features/profile/` | Edição de perfil, avatar, preferências |

## Padrões

- **Componentes:** PascalCase
- **Imports:** `@/` alias pra imports absolutos
- **State:** TanStack Query (server state), useState (local state)
- **Testes:** Colocalizados com componentes
- **Styling:** Tailwind CSS v4 + shadcn/ui

## Próximas Seções

- [[Docs/Apps/Client/Journey Feed Features|Journey Feed Features]] — arquitetura completa da feature de leitura
- [[Docs/Apps/Client/Components|Components]] — estrutura de componentes (ui, shared, feature)
- [[Docs/Apps/Client/State Management|State Management]] — TanStack Query patterns

---

◀ [[Docs/Apps/_Index|Apps]] · [[Docs/Apps/Client/Journey Feed Features|Journey Feed Features]] ▶
