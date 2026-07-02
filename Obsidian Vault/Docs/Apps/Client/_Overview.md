---
title: "Client"
section: "Docs"
subsection: "Apps"
tags: [versum, app, client, frontend]
up: "[[Docs/Apps/_Index]]"
related: ["[[Docs/API Development]]", "[[Rules/06 Frontend Animations]]"]
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
│   ├── app/                  # App Router pages (private, auth, api, privacy)
│   ├── components/
│   │   ├── provider/         # React Query + Theme providers
│   │   ├── shared/           # AppNavbar, ActionButton, StepTransition, etc.
│   │   └── ui/               # shadcn/ui (avatar, button, card, input, etc.)
│   ├── dal/                  # Data access layer
│   │   ├── auth/             # Session cache
│   │   ├── orval/            # Orval-generated (fetch, TanStack Query, Zod)
│   │   └── profiles/         # Profile cache
│   ├── features/             # Feature modules
│   │   ├── bible/            # Navegação bíblica (livros, capítulos, versículos)
│   │   ├── feed/journey/     # Journey feed (components, hooks, contexts)
│   │   ├── login/            # Magic link login
│   │   ├── onboarding/       # Onboarding flow (consent, form steps)
│   │   ├── profile/          # Profile edit
│   │   └── search/           # Busca de livros, capítulos e versículos
│   └── lib/                  # Utilities (api-fetcher, auth, utils)
├── public/                   # Assets estáticos
└── package.json
```

## Features

| Feature | Localização | Descrição |
|:--|:--|:--|
| **Bible** | `features/bible/` | Navegação bíblica (livros, capítulos, versículos) |
| **Feed/Journey** | `features/feed/journey/` | [[Docs/Apps/Client/Journey Feed Features|Feed infinito de leitura bíblica com scroll snap]] |
| **Login** | `features/login/` | Autenticação via magic link |
| **Onboarding** | `features/onboarding/` | Fluxo de boas-vindas e setup inicial |
| **Profile** | `features/profile/` | Edição de perfil, avatar, preferências |
| **Search** | `features/search/` | Busca de livros, capítulos e versículos |

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
