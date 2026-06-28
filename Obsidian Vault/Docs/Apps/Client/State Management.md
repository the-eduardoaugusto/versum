---
title: "Client — State Management"
section: "Docs"
subsection: "Apps"
tags: [versum, client, state, context, query]
up: "[[Docs/Apps/Client/_Overview]]"
related: ["[[Docs/Apps/Client/Components]]", "[[Docs/API Development]]"]
depth: 2
---

# 🔄 Client — State Management

Gerenciamento de estado com TanStack Query para server state e Context API para estado local de features complexas.

## Stack

- **Server State:** TanStack Query v5 (gerado via Orval)
- **API Calls:** Orval (OpenAPI → tipadas Query hooks)
- **Feature State:** Context API (apenas dentro da própria feature, ex: `FeedProvider`)
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

### Context API (Feature State)

Features complexas podem usar Context API para centralizar estado e lógica localmente:

```typescript
// features/feed/journey/contexts/feed-context.tsx
const FeedContext = createContext<FeedContextValue | null>(null)

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const { chapters, progress, isLoading, ... } = useJourneyFeed()
  const { isMarking } = useJourneyProgress()
  const { activeChapterId } = useActiveChapter()

  return (
    <FeedContext.Provider value={{ chapters, progress, isLoading, ... }}>
      {children}
    </FeedContext.Provider>
  )
}
```

**Quando usar Context API:**
- Feature com múltiplos hooks que precisam ser consumidos por vários componentes internos
- Estado compartilhado apenas dentro da própria feature (nunca entre features)
- Abstrair lógica de hooks dos componentes de apresentação

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

### Evitar Compartilhamento Global

🚫 **Não usar** Context API para compartilhar server state entre features — TanStack Query já faz cache e pode ser consumido de qualquer lugar.

✅ **Usar** TanStack Query para dados do servidor em qualquer lugar.

✅ **Usar** Context API para estado local da feature (ex: `FeedProvider`).

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
