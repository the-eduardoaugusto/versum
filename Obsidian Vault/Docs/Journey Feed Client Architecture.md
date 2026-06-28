---
title: "Journey Feed - Client Architecture"
section: Docs
tags: [versum, docs, journey-feed, client, architecture, frontend]
up: "[[Docs/_Index|Docs]]"
prev: "[[Docs/Apps/Client/_Overview]]"
next: "[[Docs/Journey Feed Data Flow Examples]]"
related: ["[[Docs/Apps/Client/Journey Feed Features]]", "[[Docs/Journey Feed Data Flow Examples]]", "[[Docs/Journey Feed - Progress Confirmation]]"]
depth: 1
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › 💻 [[Docs/Apps/Client/_Overview|Client]] › **Journey Feed Architecture**

---

> [!info] Sobre este documento
> **Data:** 2026-06-27 · **Escopo:** Client-side da feature Journey Feed  
> **Áreas:** `apps/client/src/features/feed/journey/`  
> **Relacionado:** [[Docs/Journey Feed Data Flow Examples|Data Flow Examples]] · [[Docs/Apps/Client/Journey Feed Features|Features Index]] · [[Docs/Journey Feed - Progress Confirmation|Progress Confirmation]]

---

# Journey Feed Client Architecture

## 1. Visão Geral

A **Journey Feed** é a feature central de leitura. É um feed infinito estilo TikTok onde o usuário rola verticalmente através de capítulos bíblicos. Cada capítulo é dividido em páginas que o usuário navega horizontalmente dentro do capítulo.

**Localização:** `/apps/client/src/features/feed/journey/`

---

## 2. Estrutura de Tipos de Dados (`types.ts`)

### Verso (Versículo)
```
VerseData
├── id: string              # ID único do versículo
├── number: number          # Número do versículo (1, 2, 3...)
└── text: string            # Conteúdo textual do versículo
```

### Página de Versículos
```
VersePage
├── startVerse: number      # Número do primeiro versículo da página
├── endVerse: number        # Número do último versículo da página
└── verses: VerseData[]     # Array de versículos que cabem nesta página
```
**Nota:** Páginas são criadas dinamicamente com base no espaço vertical disponível. Um capítulo grande pode ter 5+ páginas.

### Capítulo
```
FeedChapter
├── id: string              # ID único do capítulo
├── bookName: string        # Nome do livro (ex: "Gênesis")
├── bookSlug: string        # Slug do livro (ex: "genesis")
├── chapterNumber: number   # Número do capítulo (1, 2, 3...)
├── totalVerses: number     # Total de versículos no capítulo
├── verses: VerseData[]     # Array de todos os versículos
└── pages?: VersePage[]     # (Opcional) Páginas pré-calculadas
```

### Progresso
```
FeedProgress
├── chaptersRead: number     # Capítulos já lidos
├── chaptersRemaining: number# Capítulos ainda para ler
├── totalChapters: number    # Total de capítulos da jornada
├── percentComplete: number  # % de conclusão (0-100)
└── isAtEnd: boolean         # Se chegou ao final
```

---

## 3. Fluxo de Dados: Do Backend ao Componente

### 3.1 Requisição Inicial

1. **Componente renderiza** → `JourneyFeed` é montado
2. **Hook `useJourneyFeed()`** executa
3. **TanStack Query** faz GET `/api/v1/readings/journey/feed` com `buffer-size=4`
4. **Backend retorna:**
   ```json
   {
     "data": {
       "current": {
         "chapter": { id, number, totalVerses },
         "book": { name, slug },
         "verses": [ { id, number, text }, ... ]
       },
       "nextItems": [
         { chapter, book, verses },
         { chapter, book, verses },
         ...
       ],
       "progress": { chaptersRead, ..., isAtEnd }
     }
   }
   ```

### 3.2 Transformação para Types Internos

**Função `extractChapters()`** converte a resposta da API:
- Extrai o capítulo atual
- Extrai os próximos capítulos do buffer (`nextItems`)
- Mapeia cada um para a interface `FeedChapter`
- Retorna array de capítulos

**Função `toProgress()`** transforma os dados de progresso:
- Aplica defaults (0 se undefined)
- Retorna objeto tipado `FeedProgress`

### 3.3 Deduplicação

**Problema:** O TanStack Query pagina indefinidamente. Capítulos podem aparecer em múltiplas páginas se o buffer sobrepõe.

**Solução** em `useJourneyFeed()`:
```typescript
const chapters = useMemo(() => {
  const allPages = query.data?.pages ?? [];
  const seenIds = new Set<string>();  // Rastreia IDs já vistos
  const result: FeedChapter[] = [];

  for (const page of allPages) {
    const extracted = extractChapters(page);
    for (const chapter of extracted) {
      if (!seenIds.has(chapter.id)) {  // Só adiciona se novo
        seenIds.add(chapter.id);
        result.push(chapter);
      }
    }
  }
  return result;
}, [query.data?.pages]);
```

---

## 4. State Management: Contexto + Hooks

### 4.1 `useFeed()` Context (Camada de Abstração)

O contexto centraliza tudo que a UI precisa:

```
FeedProvider
│
├─ useJourneyFeed()         → chapters, progress, isLoading, fetchNextPage...
├─ useJourneyProgress()     → isMarking (estado do POST)
└─ useActiveChapter()       → activeChapterId (qual capítulo está visível)
│
└─ FeedContext.Provider
   └─ useFeed() hook para componentes consumidores
```

**Dados fornecidos pelo contexto:**
```typescript
interface FeedContextValue {
  chapters: FeedChapter[];
  progress: FeedProgress | null;
  activeChapterId: string | null;  // Qual capítulo está visível
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  isMarking: boolean;  // Se está marcando capítulo como lido
}
```

---

## 5. Componentes Principais

### 5.1 `JourneyFeed` (Componente Raiz)

**Responsabilidade:** Renderizar o feed com as três camadas de scroll.

**Estrutura:**
```
JourneyFeed
├─ container (scroll Y vertical - capítulos)
│  ├─ ChapterView (capítulo 1)
│  ├─ ChapterView (capítulo 2)
│  └─ ChapterView (capítulo N)
└─ FeedEmpty (quando isAtEnd = true)
```

**Estilos CSS importantes:**
- `scrollSnapType: "y mandatory"` → Snap vertical por capítulo
- `overflowY: "scroll"` → Rola verticalmente
- `scrollBehavior: "smooth"` → Animação suave (se prefersReducedMotion = false)

**Estados:**
- `isLoading` → mostra 3x `ChapterSkeleton`
- `isError` → mostra mensagem com botão "Tentar novamente"
- Normal → renderiza capítulos + skeleton se está buscando próxima página

### 5.2 `ChapterView` (Capítulo com Paginação Interna)

**Responsabilidade:** Renderizar um capítulo com páginas horizontais.

**Fluxo de Renderização:**

1. **Render invisível** (measureRef):
   - Renderiza todos os versículos do capítulo **invisíveis**
   - Mede a altura de cada versículo
   - Calcula quantas linhas cada verso ocupa

2. **Packing** (função `packPages()`):
   - Agrupa versículos em páginas baseado na altura disponível
   - Exemplo: Se 5 versículos cabem na tela, página 1 tem versículos 1-5, página 2 tem 6-10, etc.

3. **Render visível**:
   - Para cada página calculada, renderiza `VersesPage`
   - Páginas ocupam `100vw` cada uma
   - Snap horizontal entre elas

**CSS importante:**
```css
scrollSnapType: "x mandatory"  /* Snap horizontal */
overflow-x: auto               /* Rola horizontalmente */
overflow-y: hidden             /* Sem scroll vertical aqui */
```

### 5.3 `VersesPage` (Página Individual)

**Responsabilidade:** Renderizar versículos de uma página.

**Layout simples:**
```
VersesPage
├─ verso 1
├─ verso 2
└─ verso N
```

Cada verso tem:
- `<sup>número</sup>` acima do texto
- Classe `text-sm md:text-base` para responsividade

---

## 6. Hooks: Lógica Reutilizável

### 6.1 `useJourneyFeed()` - Busca de Dados

**O que faz:**
- Executa TanStack Query com `useInfiniteQuery`
- Fetch automático de 4 capítulos por página (`buffer-size=4`)
- Máx de 3 páginas na memória (`maxPages: 3`)
- Cache por 60 segundos (`staleTime: 60_000`)
- Retry herdado do `QueryClient` global: apenas erros 5xx, backoff exponencial 1s/2s/4s (máx 3 tentativas, cap 30s)

**Retorna:**
```typescript
{
  chapters: FeedChapter[],      // Array deduplicado
  progress: FeedProgress | null,
  isLoading: boolean,
  isError: boolean,
  error: Error | null,
  fetchNextPage: () => Promise<void>,
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  refetch: () => Promise<void>
}
```

**Nota:** O retry **não** é configurado diretamente no hook. Ele herda do `QueryClient` (`react-query-provider.tsx`) via `retry: retryOn5xx` e `retryDelay: exponentialDelay` definidos em `src/lib/retry-utils.ts`. Erros 4xx (401, 403, 409) **nunca** são retentados.

### 6.2 `useActiveChapter()` - Rastreamento de Visibilidade

**O que faz:**
- Usa `IntersectionObserver` para saber qual capítulo está visível
- Quando capítulo sai de tela (após 500ms debounce), enfileira o save
- Saves são processados **em série** via `saveQueueRef` + `isSavingRef` — nunca duas POSTs simultâneas para o mesmo usuário
- Retry automático na função `saveChapterRead()`: até 3 tentativas para erros 5xx com backoff exponencial
- Se todas as tentativas falharem: toast `"Progresso pode não ter sido salvo"` (não bloqueia o usuário)
- Se a resposta for 409 (ponteiro do servidor fora de sincronia): invalida `["journey-feed"]` para resincronizar, sem toast
- Buffer fetch (`fetchNextPage`) só é chamado se o save foi bem-sucedido

**Fluxo:**
```
Usuário rola → capítulo entra em foco → activeChapterId muda
            → capítulo sai de foco → aguarda 500ms
            → chapterId entra na saveQueueRef
            → processQueue() serializa saves (isSavingRef)
            → saveChapterRead() chama POST /api/v1/readings/journey/next
                ├─ 200 → saved=true → se near-end, fetchNextPage()
                ├─ 409 → invalida feed query, saved=false
                ├─ 5xx → retry (até 3x, backoff 1s/2s/4s)
                └─ 5xx esgotado → toast + console.error, saved=false
```

**Config do IntersectionObserver:**
```javascript
threshold: 0.5,           // 50% visível = intersecting
rootMargin: "-100px 0px"  // Margem virtual de 100px
```

### 6.3 `useKeyboardNavigation()` - Navegação por Teclado

**Teclas suportadas:**
- `ArrowUp` → Rola para capítulo anterior
- `ArrowDown` → Rola para capítulo próximo

**Como funciona:**
1. Encontra todos os elementos `[data-chapter-id]`
2. Calcula qual capítulo está mais próximo do centro da tela
3. Ao pressionar seta, rola suavemente para o próximo/anterior

### 6.4 `useChapterPagination()` - Página Ativa do Capítulo

**O que faz:**
- Rastreia qual página (horizontal) está visível no capítulo
- Retorna `activePage: number` (índice 0-based)

---

## 7. Fluxo de Interação do Usuário

### Cenário 1: Usuário abre a app

```
JourneyFeed monta
    ↓
useJourneyFeed() → TanStack Query faz GET /feed
    ↓
isLoading = true → renderiza ChapterSkeleton
    ↓
Backend retorna capítulos atuais + buffer
    ↓
extractChapters() processa resposta
    ↓
chapters renderizam com ChapterView
    ↓
useActiveChapter() monta IntersectionObserver
```

### Cenário 2: Usuário rola para baixo

```
Usuário rola o feed verticalmente (JourneyFeed container)
    ↓
IntersectionObserver detecta novos capítulos entrando
    ↓
setActiveChapterId(chapterId) atualiza
    ↓
Usuario vê o capítulo por > 0.5 segundos
    ↓
Capítulo sai de tela (ou rola rápido)
    ↓
Debounce 500ms → chapterId entra na saveQueueRef
    ↓
processQueue() (serializado — uma POST por vez)
    ↓
saveChapterRead() POST /api/v1/readings/journey/next
    ├─ 200 OK → saved=true
    │     ↓
    │   Se perto do fim → fetchNextPage()
    │   TanStack Query faz GET /feed
    │   Novos capítulos adicionados ao chapters array
    │
    ├─ 5xx → retry (1s/2s/4s, até 3x)
    │   └─ se esgotado → toast "Progresso pode não ter sido salvo"
    │
    └─ 409 → ponteiro do servidor fora de sincronia
          → invalida ["journey-feed"] → feed resincroniza
```

### Cenário 3: Usuário navegando página dentro de capítulo

```
Usuário rola horizontalmente dentro de ChapterView
    ↓
ScrollSnap leva para próxima página automaticamente
    ↓
useChapterPagination() detecta mudança
    ↓
activePage atualiza no ChapterHeader
    ↓
Mostra "página X de Y" no topo
```

### Cenário 4: Usuário pressiona seta para baixo

```
useKeyboardNavigation() escuta keydown
    ↓
Se ArrowDown:
  - Encontra todos [data-chapter-id] elementos
  - Calcula qual está mais visível (centro da tela)
  - Rola suavemente para o próximo
    ↓
Capítulo seguinte fica visível
```

---

## 8. Otimizações e Detalhes de Performance

### 8.1 Paginação Horizontal (ChapterView)

**Problema:** Um capítulo com 300+ versículos em uma tela pequena causa scroll travado.

**Solução:**
1. Renderiza todos os versículos invisíveis (`visibility: hidden`)
2. Mede a altura de cada um
3. Agrupa em páginas que cabem na tela
4. Renderiza só as páginas visíveis (scroll snap)

**Benefício:** Scroll suave, sem virtualização complexa.

### 8.2 IntersectionObserver com Debounce + Fila Serializada

**Problema:** Marcação de capítulo como lido a cada pixel de mudança. E dois capítulos saindo da viewport quase simultaneamente podem disparar duas POSTs paralelas, causando 409 do servidor (que só aceita um capítulo por vez em ordem).

**Solução — debounce + fila:**
```javascript
// Debounce para não marcar ao rolar rápido
debounceRef.current = setTimeout(() => {
  saveQueueRef.current.push(chapterId);
  processQueue(); // serializa — só uma POST ativa por vez
}, 500);

// Fila: processa um capítulo por vez
async function processQueue() {
  if (isSavingRef.current) return;  // já tem uma POST em curso
  isSavingRef.current = true;
  while (saveQueueRef.current.length > 0) {
    const chapterId = saveQueueRef.current.shift();
    await saveChapterRead(chapterId, queryClient);
  }
  isSavingRef.current = false;
}
```

**Benefício:** Apenas marca quando usuário realmente saiu do capítulo, e nunca com duas requisições simultâneas que causariam 409.

### 8.3 Buffer do Backend

**Config:** `buffer-size=4`

**Significa:**
- Backend retorna capítulo atual + 4 próximos
- Total: 5 capítulos por requisição
- Se usuário estiver no capítulo 1, backend enviará capítulos 1-5

**Benefício:** Scroll contínuo sem esperar requisições. User nunca vê "carregando".

### 8.4 Máximo de Páginas em Cache

**Config:** `maxPages: 3`

**Significa:**
- TanStack Query mantém só as 3 últimas páginas em memória
- Se fetch 4ª página, descarta 1ª

**Benefício:** RAM limitada mesmo com feed infinito.

### 8.5 Preferência de Movimento

```typescript
const [prefersReducedMotion] = useState(() =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
);
```

**Efeito:**
- Se SO tem "motion reduzido" ativado → `scrollBehavior: "auto"`
- Caso contrário → `scrollBehavior: "smooth"`

**Benefício:** Acessibilidade. Usuários sensíveis a movimento não sofrem.

### 8.6 Deduplicação de Capítulos

**Problema:** Buffer do backend pode sobrepor entre páginas.
- Página 1: capítulos 1, 2, 3, 4, 5
- Página 2: capítulos 4, 5, 6, 7, 8, 9 (overlap!)

**Solução:** `Set<string>` rastreia IDs já adicionados.

**Benefício:** Array final tem cada capítulo uma única vez.

---

## 9. Fluxo de Estados (State Machine)

```
┌─────────────┐
│  LOADING    │  isLoading=true, chapters=[]
└──────┬──────┘
       │ GET /feed retorna
       ↓
┌─────────────┐
│   READY     │  isLoading=false, chapters=[...]
└──────┬──────┘
       │ (usuário rola)
       ├─→ Novo capítulo entra em foco
       │   setActiveChapterId(id)
       │
       └─→ Capítulo sai após 500ms
           chapterId entra na saveQueue (serializado)
           POST /api/v1/readings/journey/next
           (background, não bloqueia UI)
           │
           ├─→ 200 → se near-end: fetchNextPage()
           │         GET /feed com página seguinte
           │         chapters array cresce
           │
           ├─→ 5xx → retry 3x com backoff exponencial
           │         se esgotado: toast (UI permanece READY)
           │
           └─→ 409 → invalida ["journey-feed"] → resincroniza

┌─────────────┐
│  ERROR      │  isError=true (falha no GET /feed após retries)
└──────┬──────┘
       │ (usuário clica "Tentar novamente")
       └─→ refetch() → volta para LOADING

Nota: falha no POST (save) nunca leva ao estado ERROR do feed.
O ERROR é exclusivo do GET /feed após esgotar os retries 5xx.
```

---

## 10. Diagrama Visual

```
App
 └─ JourneyFeed (container vertical, scroll Y)
     ├─ ChapterView #1 (scroll snap Y)
     │  └─ PagesContainer (scroll X horizontal)
     │     ├─ VersesPage #1 (página 1 do capítulo)
     │     ├─ VersesPage #2 (página 2 do capítulo)
     │     └─ VersesPage #N
     │
     ├─ ChapterView #2
     │  └─ PagesContainer
     │     ├─ VersesPage #1
     │     ├─ VersesPage #2
     │     └─ ...
     │
     └─ ChapterView #N
        └─ ...

Hooks em tempo de execução:
├─ useJourneyFeed()
│  └─ TanStack Query (GET /feed, InfiniteQuery)
│
├─ useActiveChapter()
│  └─ IntersectionObserver (qual [data-chapter-id] está visível)
│
├─ useKeyboardNavigation()
│  └─ addEventListener("keydown")
│
└─ useChapterPagination()
   └─ IntersectionObserver (qual página dentro do capítulo)
```

---

## 11. Resumo da Sequência de Renderização

1. **Componente monta** → JourneyFeed renderiza
2. **useJourneyFeed()** → Query GET /feed ativa
3. **isLoading** → Skeletons aparecem
4. **Resposta chega** → extractChapters() processa
5. **chapters estado** → ChapterView renderiza para cada
6. **ChapterView** → Renderiza invisível (measure), calcula páginas, renderiza visível
7. **VersesPage** → Renderiza versículos com números
8. **Hooks** → useActiveChapter, useKeyboardNavigation, useChapterPagination ativam

---

## 12. Checklist de Entendimento

- [x] Tipos de dados (Verso, Página, Capítulo, Progresso)
- [x] Fluxo backend → frontend
- [x] Deduplicação de capítulos
- [x] State via FeedProvider + useFeed()
- [x] JourneyFeed como raiz
- [x] ChapterView com paginação interna
- [x] VersesPage renderiza versículos
- [x] useJourneyFeed() faz queries
- [x] useActiveChapter() marca como lido
- [x] useKeyboardNavigation() para teclas
- [x] useChapterPagination() página ativa
- [x] Otimizações (buffer, debounce, snap, cache)
- [x] Fluxo de interação do usuário

---

◀ [[Docs/Apps/Client/_Overview|Client]] · [[Docs/Journey Feed Data Flow Examples|Data Flow Examples]] ▶
