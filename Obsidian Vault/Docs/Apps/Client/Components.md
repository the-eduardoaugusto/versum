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

Componentes divididos em 3 camadas:

### 1. **UI Primitivos** (`components/ui/`)

Componentes shadcn/ui reutilizáveis — button, card, input, label, avatar, etc.

```
components/ui/
├── button.tsx
├── card.tsx
├── input.tsx
├── label.tsx
├── avatar.tsx
└── ...
```

### 2. **Componentes Compartilhados** (`components/shared/`)

Componentes usados por múltiplas features — navbar, action-button, field-error, etc.

```
components/shared/
├── app-navbar/
│   ├── navbar.tsx
│   └── navbar-item.tsx
├── action-button.tsx
├── field-error.tsx
└── step-transition.tsx
```

### 3. **Componentes de Feature** (`features/<feature>/components/`)

Componentes específicos de cada feature, colocalizados com lógica.

```
features/feed/journey/components/
├── journey-feed.tsx        # Container principal
├── chapter-view.tsx        # Visualização de capítulo
├── chapter-header.tsx      # Header com indicadores
├── verses-page.tsx         # Página de versículos
├── page-dots.tsx           # Indicador de página
├── feed-empty.tsx          # Estado final
├── chapter-skeleton.tsx    # Loading state
└── index.ts                # Barrel export
```

## Padrões

- **Export:** Named exports, componentes PascalCase
- **Props:** Typed com TypeScript, extensíveis via `...rest`
- **Styling:** Tailwind CSS v4
- **Testes:** Colocalizados (`component.test.tsx`)
- **Acessibilidade:** ARIA labels, keyboard navigation

---

◀ [[Docs/Apps/Client/_Overview|Overview]] · [[Docs/Apps/Client/State Management|State]] ▶
