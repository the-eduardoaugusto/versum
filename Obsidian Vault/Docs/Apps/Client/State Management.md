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

Gerenciamento de estado com TanStack Query para server state. Não usa Context API para estado compartilhado.

## Stack

- **Server State:** TanStack Query v5 (gerado via Orval)
- **API Calls:** Orval (OpenAPI → tipadas Query hooks)
- **Component State:** useState local quando necessário

## Patterns

### TanStack Query (Server State)

**Queries** — Buscar dados do servidor:

```typescript
const { data, isLoading, error } = useJourneyFeed()
const { data: profile } = useGetApiV1ProfilesMe()
```

**Mutations** — Atualizar dados:

```typescript
const { mutate: markAsRead } = useMarkAsRead()
const { mutate: updateProfile } = usePatchApiV1ProfilesMe()

mutate({ chapterId: '123' })
```

**Features:**
- Auto-cache de queries
- Retry automático em falhas
- Stale time configurável
- Refetch em background
- Infinite queries para feeds (maxPages: 3)

**Geração:** Todos os hooks são gerados via Orval a partir da OpenAPI spec. Não escrever manualmente.

### Local State

Para UI state pequeno ou temporário, usar `useState`:

```typescript
const [isOpen, setIsOpen] = useState(false)
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
```

**Quando usar useState:**
- UI transient (drawer open, modal visibility, form input)
- Não compartilhado entre features
- Lifecycle = componente que contém

### Evitar Compartilhamento

🚫 **Não usar** Context API ou global state para compartilhar server state — TanStack Query já faz cache.

✅ **Usar** TanStack Query para dados do servidor em qualquer lugar.

---

## Exemplo Real: Journey Feed

```typescript
// hooks/use-journey-feed.ts
export function useJourneyFeed() {
  return useInfiniteQuery({
    queryKey: ['journey-feed'],
    queryFn: ({ pageParam }) => fetchFeed({ offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    maxPages: 3
  })
}

// components/journey-feed.tsx
function JourneyFeed() {
  const { data, fetchNextPage, hasNextPage } = useJourneyFeed()
  
  // data é automaticamente cacheado e refetch em background
  return <div>{data?.pages.map(page => ...)}</div>
}
```

---

◀ [[Docs/Apps/Client/Components|Components]] · [[Docs/Apps/_Index|Apps]] ▶
