---
title: "Journey Feed - Features Index"
section: "Docs"
subsection: "Apps"
tags: [versum, docs, client, features, journey-feed, index]
up: "[[Docs/Apps/Client/_Overview]]"
prev: "[[Docs/Apps/Client/_Overview]]"
next: "[[Docs/Apps/Client/Components]]"
related: ["[[Docs/Journey Feed Client Architecture]]", "[[Docs/Journey Feed Data Flow Examples]]", "[[Docs/Journey Feed - Progress Confirmation]]", "[[Docs/Apps/Client/_Overview]]"]
depth: 2
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › 📱 [[Docs/Apps/_Index|Apps]] › 💻 [[Docs/Apps/Client/_Overview|Client]] › **Journey Feed**

---

> [!info] Sobre este documento
> **Data:** 2026-06-27 · **Tipo:** Índice de recursos  
> **Áreas:** `apps/client/src/features/feed/journey/`  
> **Documentação Completa:**
> - [[Docs/Journey Feed Client Architecture|Architecture]] — componentes, hooks, fluxos
> - [[Docs/Journey Feed Data Flow Examples|Data Flow Examples]] — exemplos práticos com JSON
> - [[Docs/Journey Feed - Progress Confirmation|Progress Confirmation]] — rastreamento de progresso

---

# 🔗 Journey Feed Features

Documentação completa da feature Journey Feed — feed infinito de leitura bíblica com paginação vertical e horizontal.

## Localização do Código

```
apps/client/src/features/feed/journey/
├── types.ts                      # Tipos de dados (VerseData, VersePage, FeedChapter, FeedProgress)
├── index.ts                      # Exports públicos
├── contexts/
│   └── feed-context.tsx          # State management centralizado via Context API
├── components/
│   ├── journey-feed.tsx          # Componente raiz (container vertical)
│   ├── chapter-view.tsx          # Renderiza capítulo com paginação horizontal
│   ├── verses-page.tsx           # Uma página dentro de um capítulo
│   ├── chapter-header.tsx        # Header com nome, número e página
│   ├── chapter-skeleton.tsx      # Loading state
│   ├── page-dots.tsx             # Indicador de página
│   └── feed-empty.tsx            # Estado de conclusão
└── hooks/
    ├── use-journey-feed.ts       # TanStack Query (infiniteQuery) para buscar capítulos
    ├── use-active-chapter.ts     # IntersectionObserver + fila serializada para marcar como lido
    ├── use-get-journey-status.ts # Query de status/progresso da jornada
    ├── use-keyboard-navigation.ts # Navegação com arrow keys
    ├── use-chapter-pagination.ts  # Página ativa do capítulo
    └── use-journey-progress.ts    # Mutation TanStack Query (invalidação de cache)

apps/client/src/lib/
└── retry-utils.ts                # retryOn5xx + exponentialDelay (usados em QueryClient e saveChapterRead)
```

## Documentação Técnica Completa

### 1. **Arquitetura e Componentes**
👉 [[Docs/Journey Feed Client Architecture]]

Explicação sequencial de:
- Estrutura de tipos de dados
- Fluxo de dados backend → frontend
- State management (FeedProvider + Context)
- Componentes principais (JourneyFeed, ChapterView, VersesPage)
- Hooks e lógica reutilizável
- Fluxo de interação do usuário
- Otimizações de performance

### 2. **Exemplos Práticos de Fluxo de Dados**
👉 [[Docs/Journey Feed Data Flow Examples]]

Exemplos reais com JSON e timestamps:
- Requisição completa backend → resposta
- Renderização de ChapterView com cálculo de páginas
- IntersectionObserver marcando capítulos como lidos
- Keyboard navigation
- Timeline completa de um usuário lendo

### 3. **Progress Confirmation (Adicional)**
👉 [[Docs/Journey Feed - Progress Confirmation]]

Detalhes de como o progresso é rastreado e confirmado.

---

## Quick Start: Entender a Feature

**Se você tem 5 minutos:**
Leia a seção "Visão Geral" e "Fluxo de Dados" em [[Docs/Journey Feed Client Architecture]]

**Se você tem 30 minutos:**
Leia todo [[Docs/Journey Feed Client Architecture]]

**Se você tem 1 hora:**
Leia [[Docs/Journey Feed Client Architecture]] + [[Docs/Journey Feed Data Flow Examples]]

**Se você vai fazer bugfix/features:**
Leia tudo + inspecione o código enquanto lê

---

## Checklist Rápido

Quando entender a feature, você consegue explicar:

- [ ] Diferença entre VerseData, VersePage e FeedChapter
- [ ] Como ChapterView calcula páginas com `packPages()`
- [ ] Como IntersectionObserver detecta capítulos visíveis
- [ ] Quando o backend é chamado (GET /feed e POST /next)
- [ ] Como deduplicação funciona (Set de IDs)
- [ ] Qual é o papel do contexto FeedProvider
- [ ] Como scroll snap funciona (X para páginas, Y para capítulos)
- [ ] Como keyboard navigation acha o capítulo mais visível
- [ ] O que acontece quando usuário chega perto do fim (fetchNextPage)
- [ ] Como preferência de movimento (prefers-reduced-motion) é usada

---

## Estrutura de Dados (Resumo)

```typescript
// Um versículo
VerseData {
  id: string;        // "vs-gen-1-1"
  number: number;    // 1
  text: string;      // "No princípio, criou Deus..."
}

// Uma página dentro de um capítulo
VersePage {
  startVerse: number;     // 1
  endVerse: number;       // 10
  verses: VerseData[];    // [verso1, verso2, ...]
}

// Um capítulo completo
FeedChapter {
  id: string;             // "ch-gen-1"
  bookName: string;       // "Gênesis"
  chapterNumber: number;  // 1
  totalVerses: number;    // 31
  verses: VerseData[];    // [verso1, verso2, ..., verso31]
  pages?: VersePage[];    // (opcional, calculado dinamicamente)
}

// Progresso da jornada
FeedProgress {
  chaptersRead: number;       // 5
  chaptersRemaining: number;  // 184
  totalChapters: number;      // 189
  percentComplete: number;    // 2.6%
  isAtEnd: boolean;           // false
}
```

---

## API Endpoints

### GET /api/v1/readings/journey/feed

Busca feed de capítulos com buffer.

**Parâmetros:**
- `buffer-size`: número de capítulos para buffer (padrão: 4)

**Resposta:**
```json
{
  "data": {
    "current": { chapter, book, verses },
    "nextItems": [{ chapter, book, verses }, ...],
    "progress": { chaptersRead, chaptersRemaining, ... }
  }
}
```

### POST /api/v1/readings/journey/next

Marca o capítulo especificado como lido e avança o ponteiro.

**Body:** `{ "chapterId": "<uuid>" }` — obrigatório.

**Respostas:**

| Status | Quando |
|:--|:--|
| `200` | Marcado com sucesso, ou no-op idempotente (já lido) |
| `400` | `chapterId` ausente / JSON inválido |
| `404` | `chapterId` não existe |
| `409` | `chapterId` não é o capítulo esperado — client deve refazer GET /feed |
| `500` | Erro interno — client retenta até 3x com backoff |

---

## Fluxo Resumido

1. **User abre app** → GET /feed busca 1 + 4 capítulos (buffer)
2. **Renderiza** → ChapterView para cada capítulo
3. **User rola** → IntersectionObserver detecta qual está visível
4. **User sai do capítulo** → Aguarda 500ms debounce
5. **POST /next** → Marca como lido
6. **Perto do fim?** → GET /feed novamente (próximo buffer)
7. **Loop** → até isAtEnd = true

---

## Performance Notes

- **Buffer:** 4 capítulos por requisição (padrão)
- **Cache:** TanStack Query 60s staleTime
- **MaxPages:** 3 páginas em memória (infiniteQuery)
- **Debounce:** 500ms antes de enfileirar save
- **IntersectionObserver:** threshold 0.5 + margin -100px
- **Scroll Snap:** Y mandatory (capítulos), X mandatory (páginas)
- **Retry (GET /feed):** apenas 5xx, backoff 1s/2s/4s, máx 3 tentativas (`retry-utils.ts`)
- **Retry (POST /next):** manual em `saveChapterRead()`, mesma lógica 5xx, máx 3 tentativas
- **Serialização:** saves de capítulo processados um por vez via `saveQueueRef` — evita 409 por concorrência no mesmo dispositivo

---

## Próximos Passos

- Ler [[Docs/Journey Feed Client Architecture]] para entender cada componente
- Ler [[Docs/Journey Feed Data Flow Examples]] para ver exemplos de dados reais
- Inspecionar o código em `apps/client/src/features/feed/journey/`
- Testar a feature no app local

---

◀ [[Docs/Apps/Client/_Overview|Client]] · [[Docs/Journey Feed Client Architecture|Architecture]] ▶
