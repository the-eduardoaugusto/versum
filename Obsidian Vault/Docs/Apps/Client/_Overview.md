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

## Padrões

- **Componentes:** PascalCase
- **Imports:** `@/` alias pra imports absolutos
- **State:** Context API + TanStack Query
- **Testes:** Colocalizados com componentes

---

◀ [[Docs/Apps/_Index|Apps]] · [[Docs/Apps/Client/Components|Components]] ▶
