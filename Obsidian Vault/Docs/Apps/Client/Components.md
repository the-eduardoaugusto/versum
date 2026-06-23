---
title: "Client — Components"
section: "Docs"
subsection: "Apps"
tags: [versum, client, components, react]
up: "[[Docs/Apps/Client/_Overview]]"
related: ["[[Docs/Apps/Client/State Management]]", "[[Rules/06 Frontend Animations]]"]
depth: 2
---

# ⚛️ Client — Components

Estrutura e padrões de componentes React.

## Organização

Componentes são organizados por feature em `apps/client/src/components/<feature>/`.

### Exemplo: Journey Feed

```
components/journey/
├── JourneyFeed.tsx         # Componente principal
├── JourneyCard.tsx         # Sub-componente
└── journey.test.tsx        # Testes
```

## Padrões

- **Export:** Named exports, componentes são PascalCase
- **Props:** Typed com TypeScript, extensíveis via `...rest`
- **Styling:** Tailwind + class names via `clsx`
- **Acessibilidade:** ARIA labels, keyboard navigation

---

◀ [[Docs/Apps/Client/_Overview|Overview]] · [[Docs/Apps/Client/State Management|State]] ▶
