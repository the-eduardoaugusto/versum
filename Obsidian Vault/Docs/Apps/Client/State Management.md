---
title: "Client — State Management"
section: "Docs"
subsection: "Apps"
tags: [versum, client, state, context, query]
up: "[[Docs/Apps/Client/_Overview]]"
related: ["[[Docs/Apps/Client/Components]]", "[[Docs/Guides/API Development]]"]
depth: 2
---

# 🔄 Client — State Management

Gerenciamento de estado com Context API + TanStack Query.

## Stack

- **Server State:** TanStack Query (gerado via Orval)
- **Client State:** Context API + useState
- **API Calls:** Geradas via Orval (OpenAPI → Query hooks)

## Padrões

### TanStack Query (Server State)

```typescript
const { data, isLoading } = useJourneyFeed()
const { mutate } = useMarkAsRead()
```

Hooks são gerados via Orval — não escrever manualmente.

### Context (Client State)

Para estado local pequeno (UI state, filters, etc.), usar Context API.

---

◀ [[Docs/Apps/Client/Components|Components]] · [[Docs/Apps/_Index|Apps]] ▶
