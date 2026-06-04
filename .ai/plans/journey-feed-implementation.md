# Journey Feed — Plano de Implementação

## 1. Visão Geral

Implementar o feed de leitura **Jornada** (sequencial do Gênesis ao Apocalipse) no client side, utilizando **Orval** + **TanStack Query** (`useInfiniteQuery`) para o fluxo de dados, e **snap scroll** (vertical + horizontal) para navegação magnética estilo TikTok.

O usuário lê capítulos inteiros em um feed vertical infinito. Cada capítulo ocupa uma tela (`100dvh`) e contém páginas horizontais com versículos. O progresso é salvo automaticamente conforme o usuário navega.

---

## 2. Stack Envolvida

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, phosphor-icons |
| Data Fetching | TanStack Query v5 (`useInfiniteQuery`, `useMutation`, `useQuery`) |
| Codegen | Orval v8.10.0 (OpenAPI → TanStack Query + Zod) |
| Package Manager | Bun |
| Linter/Formatter | Biome |
| Test | Vitest |
| API Backend | Hono (OpenAPIHono) rodando em `apps/api/` |

---

## 3. Comportamento Esperado

### 3.1 Na Montagem

1. Hook `useJourneyFeed` dispara `useInfiniteQuery` com `queryFn` = `GET /api/v1/readings/journey/feed?buffer-size=4`
2. API retorna:
   ```json
   {
     "success": true,
     "data": {
       "current": { "chapter": {…}, "book": {…}, "verses": […] },
       "nextItems": [ { "chapter": {…}, "book": {…}, "verses": […] }, … ],
       "progress": { "chaptersRead": 0, "chaptersRemaining": 1189, "totalChapters": 1189, "percentComplete": 0, "isAtEnd": false }
     },
     "pagination": { "hasNextPage": true, … }
   }
   ```
3. `current` + `nextItems` são planificados e acumulados num array `chapters[]`
4. Cada capítulo é dividido em **páginas** de versículos via `paginate-verses.ts`
5. O feed renderiza verticalmente: cada ChapterCard ocupa `100dvh` com `scroll-snap-align: start`

### 3.2 Navegação Vertical (Entre Capítulos)

- Container com `overflow-y: scroll; scroll-snap-type: y mandatory; height: 100dvh`
- Cada `ChapterView` tem `scroll-snap-align: start; scroll-snap-stop: always; height: 100dvh`
- Swipe/gira vertical → próximo/anterior capítulo
- Seta pra baixo (`ArrowDown`) → próximo capítulo
- Seta pra cima (`ArrowUp`) → capítulo anterior

### 3.3 Navegação Horizontal (Dentro do Capítulo)

- Container interno com `overflow-x: auto; scroll-snap-type: x mandatory`
- Cada `VersesPage` tem `scroll-snap-align: start; width: 100vw`
- Swipe/gira horizontal → próxima/anterior página de versículos
- O header do capítulo mostra o range de versículos atual e os dots

### 3.4 Auto-avance do Progresso

- `IntersectionObserver` no container vertical detecta qual capítulo está em view
- Quando um capítulo **sai completamente de view** (ou fica <40% visível), dispara:
  ```
  POST /api/v1/readings/journey/next  →  marca capítulo como lido
  ```
- Se `buffer-size` capítulos foram consumidos e o buffer está baixo (restam 2), dispara:
  ```
  POST /api/v1/readings/journey/next  (avança cursor)
  GET  /api/v1/readings/journey/feed?buffer-size=4  (novo snapshot)
  → extrai capítulos novos e acumula em chapters[]
  ```

### 3.5 Indicador de Página

- Header do capítulo: `Gênesis 1  •  1-7  ● ○ ○ ○ ○`
- `●` = página atual (maior contraste), `○` = demais páginas
- Atualizado via `onScroll` + `requestAnimationFrame` no container horizontal
- É o **único** indicador — não repete no footer

### 3.6 Estado Final

- Quando `progress.isAtEnd === true` e `getNextPageParam` retorna `undefined`, exibe componente `FeedEmpty`
- Mensagem: "Você completou a Bíblia!"
- Botão: "Começar novamente" (zera progresso — a definir em futura sprint)

---

## 4. O Que NÃO Deve Acontecer

- ❌ **Requests duplicados**: `fetchNextPage` só dispara se `hasNextPage && !isFetchingNextPage`
- ❌ **POST/next sem necessidade**: chamado apenas para capítulo que saiu de view, com debounce de 500ms
- ❌ **Duplicação de capítulos no array**: dedup com `Set<chapterId>` no acumulador
- ❌ **Scroll horizontal interferindo no vertical**: containers separados, gestos são naturais (horizontal não propaga pra vertical)
- ❌ **UI poluída**: um único header por capítulo, dots não repetidos
- ❌ **Dados expirados**: `staleTime: 60_000`, refetch manual após mutation
- ❌ **Capítulos grandes quebrados visualmente**: overflow-y: auto na VersesPage para scroll vertical se necessário
- ❌ **Mudança de capítulo sem salvar progresso**: IntersectionObserver + POST/next garantem que progresso seja persistido

---

## 5. Estrutura de Diretórios

```
apps/client/src/features/feed/journey/
├── hooks/
│   ├── index.ts
│   ├── use-journey-feed.ts              # useInfiniteQuery + dedup
│   ├── use-journey-progress.ts          # POST/next + GET/status
│   ├── use-active-chapter.ts            # IntersectionObserver vertical
│   └── use-chapter-pagination.ts        # scrollX → activePage
├── components/
│   ├── index.ts
│   ├── journey-feed.tsx                 # Container vertical snap
│   ├── chapter-view.tsx                 # Card = header + pages + dots
│   ├── chapter-header.tsx               # "Gênesis 1 • 1-7 ●○○○○"
│   ├── verses-page.tsx                  # Página horizontal de versículos
│   ├── page-dots.tsx                    # ●○○○○
│   ├── feed-progress.tsx                # Barra global topo
│   ├── chapter-skeleton.tsx             # Loading shimmer
│   └── feed-empty.tsx                   # "Bíblia completa!"
├── contexts/
│   └── feed-context.tsx                 # Provider unificado
├── utils/
│   └── paginate-verses.ts              # splitVersesIntoPages()
├── types.ts                             # FeedChapter, VersePage, etc.
└── index.ts                             # Barrel exports
```

---

## 6. Especificação de Cada Arquivo

### 6.1 `types.ts`

```typescript
export interface VerseData {
  id: string;
  number: number;
  text: string;
}

export interface VersePage {
  startVerse: number;
  endVerse: number;
  verses: VerseData[];
}

export interface FeedChapter {
  id: string;
  bookName: string;
  bookSlug: string;
  chapterNumber: number;
  totalVerses: number;
  verses: VerseData[];
  pages: VersePage[];
}

export interface FeedProgress {
  chaptersRead: number;
  chaptersRemaining: number;
  totalChapters: number;
  percentComplete: number;
  isAtEnd: boolean;
}
```

### 6.2 `utils/paginate-verses.ts`

**Responsabilidade:** Dividir um array de `VerseData[]` em páginas de versículos.

**Regras de paginação:**

| Total de versículos | Versos por página |
|---------------------|-------------------|
| ≤ 10 | 3 |
| 11-30 | 6 |
| 31-60 | 10 |
| 61-100 | 15 |
| > 100 | 20 |

- Última página pode ter menos versos
- Capítulos com 1-3 versos → 1 página
- Ex: Salmo 119 (176 versos, 20 vpp) → 9 páginas (20/20/20/20/20/20/20/20/16)

```typescript
export function paginateVerses(verses: VerseData[]): VersePage[]
```

**Testes:**
- Capítulo vazio → array vazio
- Capítulo com 2 versos → 1 página (start=1, end=2)
- Capítulo com 7 versos (3 vpp) → 3 páginas (1-3, 4-6, 7-7)
- Capítulo com 176 versos (20 vpp) → 9 páginas, última com 16

### 6.3 `hooks/use-journey-feed.ts`

**Responsabilidade:** Gerenciar o estado do feed infinito.

```typescript
function useJourneyFeed() {
  // useInfiniteQuery com:
  //   queryKey: ['journey-feed']
  //   queryFn: GET /feed (sem side effects)
  //   initialPageParam: 0
  //   getNextPageParam: progress.isAtEnd ? undefined : 1
  //   maxPages: 3
  
  // Acumulador de capítulos:
  //   seenChapterIds = useRef(new Set<string>())
  //   chapters = useRef<FeedChapter[]>([])
  //   useEffect: extrai current + nextItems de cada nova página
  //             → dedup via Set
  //             → paginateVerses() em cada capítulo
  //             → append em chapters[]
  
  // fetchNextPage custom:
  //   if (!hasNextPage || isFetchingNextPage) return
  //   await postApiV1ReadingsJourneyNext() (avança cursor)
  //   await baseFetchNextPage() (GET /feed)

  return {
    chapters,
    progress,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
```

**Comportamento:**
- Na montagem: dispara GET /feed → acumula current + nextItems
- fetchNextPage: POST/next → GET/feed → extrai NOVOS capítulos
- Se o servidor retornar capítulo já visto, é ignorado pelo dedup
- Se progress.isAtEnd=true, getNextPageParam retorna undefined

**Testes:**
- Mock do fetch, testa retorno inicial (current + nextItems)
- Mock do POST/next + GET/feed, testa acumulação de 2 páginas
- Testa dedup: mesmo capítulo retornado não gera duplicata
- Testa hasNextPage=false quando isAtEnd
- Testa isLoading durante fetch
- Testa isFetchingNextPage durante fetchNextPage
- Testa que fetchNextPage NÃO dispara se hasNextPage=false
- Testa que fetchNextPage NÃO dispara se isFetchingNextPage=true

### 6.4 `hooks/use-journey-progress.ts`

**Responsabilidade:** Mutation de avanço + query de status.

```typescript
function useJourneyProgress() {
  const queryClient = useQueryClient();
  
  const { mutateAsync: markAsRead, isPending: isMarking } = 
    usePostApiV1ReadingsJourneyNext({
      mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journey-status'] }) },
    });
  
  const { data: statusData } = useGetApiV1ReadingsJourneyStatus();
  
  return {
    markAsRead,
    isMarking,
    status: extractStatus(statusData),
  };
}
```

**Testes:**
- Mock POST/next, testa que chama endpoint com sucesso
- Testa que onSuccess invalida a query de status
- Testa retorno de status (chaptersRead, percentComplete)

### 6.5 `hooks/use-active-chapter.ts`

**Responsabilidade:** Detectar qual capítulo está ativo no scroll vertical.

```typescript
function useActiveChapter(
  containerRef: RefObject<HTMLDivElement>,
  chapters: FeedChapter[],
): { activeChapterId: string | null; markPreviousAsRead: () => Promise<void> }
```

- Cria `IntersectionObserver` com `threshold: 0.5` e `rootMargin: '-100px 0px'`
- Observa os elementos `[data-chapter-id="..."]` dentro do container
- Quando um capítulo cruza o threshold:
  - Se entrou em view → `activeChapterId = chapterId`
  - Se saiu de view → dispara `markAsRead` (POST/next) com debounce de 500ms
  - Se `chapters.indexOf(activeChapter) >= chapters.length - 2` → dispara `fetchNextPage()`
- Retorna `{ activeChapterId, markPreviousAsRead }`

**Regras:**
- Não marcar como lido se `isAtEnd` for true
- Não marcar como lido se o capítulo nunca foi "ativo" (primeiro carregamento)
- Debounce: 500ms sem mudança de activeChapter antes de marcar como lido

**Testes:**
- Mock IntersectionObserver, testa que detecta entrada/saída de capítulo
- Testa que capítulo que saiu de view dispara POST/next
- Testa debounce: mudanças rápidas não disparam múltiplos POST
- Testa que fetchNextPage é chamado quando buffer está baixo (faltam 2)

### 6.6 `hooks/use-chapter-pagination.ts`

**Responsabilidade:** Detectar página ativa no scroll horizontal.

```typescript
function useChapterPagination(
  containerRef: RefObject<HTMLDivElement>,
): { activePage: number; pageCount: number }
```

- Listener `scroll` com `requestAnimationFrame`
- `activePage = Math.round(scrollLeft / 100vw)`
- `pageCount = children.length`
- Cleanup no unmount

**Testes:**
- Mock scrollLeft, testa que activePage é calculado corretamente
- Testa que resize da janela recalcula
- Testa cleanup no unmount

### 6.7 `components/journey-feed.tsx`

**Responsabilidade:** Layout principal do feed.

```tsx
"use client";

export function JourneyFeed() {
  const { chapters, progress, isLoading, isError, fetchNextPage, hasNextPage } = useJourneyFeed();
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeChapterId } = useActiveChapter(containerRef, chapters);

  if (isLoading) return <ChapterSkeleton count={3} />;
  if (isError) return <div>Erro ao carregar feed</div>;

  return (
    <div className="relative h-dvh">
      <FeedProgress progress={progress} activeChapterId={activeChapterId} />
      <div ref={containerRef} className="feed-container">
        {chapters.map((chapter) => (
          <ChapterView
            key={chapter.id}
            chapter={chapter}
            isActive={chapter.id === activeChapterId}
          />
        ))}
        {isFetchingNextPage && <ChapterSkeleton count={2} />}
        {!hasNextPage && progress?.isAtEnd && chapters.length > 0 && (
          <FeedEmpty />
        )}
      </div>
    </div>
  );
}
```

**CSS:**
```css
.feed-container {
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  height: 100dvh;
  max-height: 100svh;
}
```

**Comportamento:**
- Loading → 3 skeletons
- Error → mensagem com botão de retry
- Empty → FeedEmpty (apenas quando `!hasNextPage && isAtEnd && chapters.length > 0`)
- Scroll → detecta activeChapter → auto-advance
- Keyboard → ArrowDown/ArrowUp scrollam entre capítulos

**Testes:**
- Renderiza capítulos do mock
- Estado loading exibe skeleton
- Estado vazio exibe FeedEmpty
- testId no container para testes de scroll

### 6.8 `components/chapter-view.tsx`

**Responsabilidade:** Card de capítulo com navegação horizontal.

```tsx
"use client";

export function ChapterView({ chapter, isActive }: { chapter: FeedChapter; isActive: boolean }) {
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const { activePage, pageCount } = useChapterPagination(pagesContainerRef);

  return (
    <div className="chapter-card" data-chapter-id={chapter.id}>
      <ChapterHeader
        bookName={chapter.bookName}
        chapterNumber={chapter.chapterNumber}
        startVerse={chapter.pages[activePage]?.startVerse ?? 1}
        endVerse={chapter.pages[activePage]?.endVerse ?? chapter.totalVerses}
        activePage={activePage}
        pageCount={pageCount}
      />
      <div ref={pagesContainerRef} className="pages-container">
        {chapter.pages.map((page, index) => (
          <VersesPage key={index} page={page} />
        ))}
      </div>
    </div>
  );
}
```

**CSS:**
```css
.chapter-card {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  height: 100dvh;
  max-height: 100svh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pages-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  display: flex;
}
```

**Testes:**
- Renderiza header com informações corretas
- Renderiza N páginas de versículos
- Scroll horizontal atualiza activePage
- data-chapter-id presente

### 6.9 `components/chapter-header.tsx`

**Responsabilidade:** Header de capítulo com indicador de página.

```tsx
interface ChapterHeaderProps {
  bookName: string;
  chapterNumber: number;
  startVerse: number;
  endVerse: number;
  activePage: number;
  pageCount: number;
}

export function ChapterHeader({ bookName, chapterNumber, startVerse, endVerse, activePage, pageCount }: ChapterHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <span className="text-sm text-muted-foreground">
        {bookName} {chapterNumber}  •  {startVerse}-{endVerse}
      </span>
      {pageCount > 1 && <PageDots activePage={activePage} pageCount={pageCount} />}
    </header>
  );
}
```

**Regras:**
- Se `pageCount <= 1`, não renderizar dots
- Range de versículos reflete a página atual
- Fonte menor, cor secundária (text-muted-foreground)

**Testes:**
- Renderiza "Gênesis 1 • 1-7" + dots
- pageCount=1 → sem dots
- Atualiza range quando activePage muda

### 6.10 `components/verses-page.tsx`

**Responsabilidade:** Página de versículos (scroll horizontal).

```tsx
interface VersesPageProps {
  page: VersePage;
}

export function VersesPage({ page }: VersePageProps) {
  return (
    <div className="verses-page">
      {page.verses.map((verse) => (
        <p key={verse.id} className="mb-4 text-base leading-relaxed">
          <sup className="mr-1 text-xs text-muted-foreground">{verse.number}</sup>
          {verse.text}
        </p>
      ))}
    </div>
  );
}
```

**CSS:**
```css
.verses-page {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  width: 100vw;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 1.5rem;
  box-sizing: border-box;
}
```

**Testes:**
- Renderiza versículos com números
- Scroll se conteúdo exceder altura

### 6.11 `components/page-dots.tsx`

**Responsabilidade:** Indicador visual de página (bolinhas).

```tsx
interface PageDotsProps {
  activePage: number;
  pageCount: number;
}

export function PageDots({ activePage, pageCount }: PageDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: pageCount }, (_, i) => (
        <span
          key={i}
          className={`block h-1.5 w-1.5 rounded-full transition-all duration-300 ${
            i === activePage
              ? 'bg-foreground scale-110'
              : 'bg-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}
```

**Regras:**
- Bolinha ativa: `bg-foreground scale-110` (maior contraste)
- Bolinhas inativas: `bg-muted-foreground/30`
- Transição suave de 300ms
- No máximo ~15 bolinhas (capítulos raramente têm mais que isso)

**Testes:**
- Renderiza N bolinhas
- Bolinha correta tem classe ativa
- Transição de cor ao mudar activePage

### 6.12 `components/feed-progress.tsx`

**Responsabilidade:** Barra global de progresso no topo do feed.

```tsx
interface FeedProgressProps {
  progress: FeedProgress | null;
  activeChapter: string | null;
}

export function FeedProgress({ progress, activeChapter }: FeedProgressProps) {
  if (!progress) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 px-6 py-2 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>{progress.percentComplete}% completo</span>
        <span>{progress.chaptersRemaining} capítulos restantes</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground transition-all duration-500"
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>
    </div>
  );
}
```

**Regras:**
- Posicionamento `absolute` no topo do container pai
- Fundo semi-transparente (`bg-background/80 backdrop-blur-sm`)
- Só renderiza se `progress` não for null
- Barra animada com `transition-all duration-500`

**Testes:**
- Renderiza porcentagem correta
- Barra com largura correta
- Não renderiza se progress é null

### 6.13 `components/chapter-skeleton.tsx`

**Responsabilidade:** Placeholder shimmer enquanto carrega.

```tsx
export function ChapterSkeleton({ count = 1 }: { count?: number }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="chapter-card animate-pulse p-6 space-y-4">
      <div className="h-4 w-1/3 bg-muted rounded" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
        <div className="h-3 w-4/6 bg-muted rounded" />
      </div>
    </div>
  ));
}
```

**Regras:**
- Mesma altura que ChapterView (`h-dvh`)
- `animate-pulse` do Tailwind
- Simula header + 3 linhas de texto

**Testes:**
- Renderiza N skeletons
- Testa classe animate-pulse

### 6.14 `components/feed-empty.tsx`

**Responsabilidade:** Estado final — Bíblia completa.

```tsx
export function FeedEmpty() {
  return (
    <div className="chapter-card flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-2xl font-semibold">Você completou a Bíblia!</h2>
      <p className="text-muted-foreground max-w-xs">
        Parabéns por concluir a leitura de toda a Bíblia.
      </p>
    </div>
  );
}
```

**Regras:**
- Mesma altura que ChapterView
- Centralizado vertical e horizontalmente
- Texto motivacional

**Testes:**
- Renderiza texto de conclusão

### 6.15 `contexts/feed-context.tsx`

**Responsabilidade:** Provider que combina hooks.

```tsx
interface FeedContextValue {
  chapters: FeedChapter[];
  progress: FeedProgress | null;
  activeChapterId: string | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  markAsRead: () => Promise<void>;
  isMarking: boolean;
}

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const feed = useJourneyFeed();
  const progress = useJourneyProgress();
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeChapterId } = useActiveChapter(containerRef, feed.chapters);

  const value = {
    ...feed,
    ...progress,
    activeChapterId,
  };

  return (
    <FeedContext.Provider value={value}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed(): FeedContextValue {
  const context = useContext(FeedContext);
  if (!context) throw new Error('useFeed must be used within FeedProvider');
  return context;
}
```

**Testes:**
- Provider renderiza children
- useFeed dentro do Provider retorna valores
- useFeed fora do Provider lança erro
- Testar valores padrão (loading, etc.)

### 6.16 `index.ts`

```typescript
export { JourneyFeed } from './journey-feed';
export { FeedProvider, useFeed } from './contexts/feed-context';
export type { FeedChapter, VersePage, VerseData, FeedProgress } from './types';
```

---

## 7. Fluxos de Dados

### 7.1 Fluxo de Carregamento Inicial

```
[Monta JourneyFeed]
  ↓
useJourneyFeed()
  → useInfiniteQuery(queryFn: GET /feed)
  → isLoading = true
  → renderiza ChapterSkeleton
  ↓
[API retorna]
  → data.pages[0] = { data: { current, nextItems, progress } }
  → extrai current + nextItems
  → converte para FeedChapter[] (paginateVerses)
  → acumula em chapters[]
  → progress = data.progress
  → isLoading = false
  ↓
[Renderiza]
  FeedProgress (barra global)
  ChapterView (current + each nextItem)
```

### 7.2 Fluxo de Scroll Vertical

```
[Usuário scrola para Ch2]
  ↓
IntersectionObserver detecta Ch1 saindo de view
  ↓ (debounce 500ms)
use-active-chapter.ts → markPreviousAsRead()
  → POST /api/v1/readings/journey/next
  → marca Ch1 como lido
  ↓
IntersectionObserver detecta Ch2 entrando em view
  → activeChapterId = "ch2"
  → ChapterHeader destaca Ch2
  ↓
[Verifica buffer]
  → chapters.length - (index of Ch2) <= 2
  → fetchNextPage()
  ↓
use-journey-feed.ts → fetchNextPage()
  → await markAsRead() (para Ch2)
  → await fetchNextPage()
  → GET /feed?buffer-size=4
  → extrai novos capítulos
  → dedup via Set
  → append em chapters[]
```

### 7.3 Fluxo de Scroll Horizontal

```
[Usuário scrola horizontalmente no Ch1]
  ↓
use-chapter-pagination.ts
  → onScroll + rAF
  → activePage = Math.round(scrollLeft / 100vw)
  → pageCount = children.length
  ↓
ChapterHeader re-renderiza:
  → "Gênesis 1 • 1-7 ●○○○○"
  → "Gênesis 1 • 8-14 ○●○○○"
  → "Gênesis 1 • 15-21 ○○●○○"
```

---

## 8. Tratamento de Erros

### 8.1 Erro de Rede

- `useInfiniteQuery` com `retry: 2` (3 tentativas no total)
- Se persistir → `isError = true` → mensagem "Erro ao carregar feed" + botão "Tentar novamente"
- Botão chama `refetch()`

### 8.2 Erro no POST/next

- `useMutation` com `onError`: log no console, sem toast (operação em background)
- Próximo scroll vai tentar novamente

### 8.3 Timeout

- `queryFn` com `AbortSignal` herdado do TanStack Query
- `fetch: { signal }` já é passado no generated code

### 8.4 Erro 401 (Sessão Expirada)

- Middleware de autenticação no proxy.ts redireciona para /login
- Feed não carrega → usuário é redirecionado antes

---

## 9. Testes

### 9.1 Ferramentas e Setup

- **Framework:** Vitest
- **Localização:** Ao lado do arquivo testado (`use-journey-feed.test.ts`)
- **Mock API:** `vi.mock()` para funções Orval
- **Mock IntersectionObserver:** `global.IntersectionObserver = vi.fn()`
- **Mock Scroll:** `element.scrollLeft` + `element.scrollWidth`

### 9.2 Casos de Teste

#### `paginate-verses.test.ts`

| Caso | Input | Esperado |
|------|-------|----------|
| Array vazio | `[]` | `[]` |
| 2 versos | `[{number:1},{number:2}]` com 3 vpp | `1 página: [1-2]` |
| 7 versos | `7 versos` com 3 vpp | `3 páginas: [1-3,4-6,7-7]` |
| 176 versos | `176 versos` com 20 vpp | `9 páginas: [1-20...161-176]` |

#### `use-journey-feed.test.ts`

| Caso | Descrição |
|------|-----------|
| Carregamento inicial | Mock GET /feed retorna current + 4 nextItems, verifica chapters[] com 5 itens |
| Segunda página | Mock POST/next + GET/feed, verifica que novos capítulos foram adicionados |
| Dedup | Mesmo capítulo retornado em páginas consecutivas, verifica 0 duplicatas |
| Fim da Bíblia | progress.isAtEnd=true → hasNextPage=false → fetchNextPage não dispara |
| Loading | isFetchingNextPage=true → fetchNextPage não dispara |
| Erro | GET /feed retorna 500 → isError=true |

#### `use-active-chapter.test.ts`

| Caso | Descrição |
|------|-----------|
| Capítulo entra em view | IntersectionObserver dispara → activeChapterId atualiza |
| Capítulo sai de view | IntersectionObserver dispara → POST/next chamado (com debounce) |
| Debounce | Múltiplas entradas/saídas em 500ms → apenas 1 POST/next |
| Buffer baixo | activeChapter nos últimos 2 → fetchNextPage chamado |
| isAtEnd | Se progress.isAtEnd → não marca como lido |

#### `chapter-view.test.tsx`

| Caso | Descrição |
|------|-----------|
| Renderiza header | Verifica "Gênesis 1 • 1-7" |
| Renderiza páginas | 3 páginas renderizadas |
| Dots | pageCount=3 → 3 bolinhas |
| Sem dots | pageCount=1 → 0 bolinhas |

#### `journey-feed.test.tsx`

| Caso | Descrição |
|------|-----------|
| Loading | isLoading=true → skeleton visível |
| Error | isError=true → mensagem de erro |
| Empty | !hasNextPage + isAtEnd → FeedEmpty |
| Dados | chapters[] com dados → ChapterView renderizado |

### 9.3 Comandos

```bash
# Rodar testes do client
bun run --filter=@versum/client test

# Rodar teste específico
bun run --filter=@versum/client test -- src/features/feed/journey/hooks/use-journey-feed.test.ts

# Coverage
bun run --filter=@versum/client test -- --coverage
```

---

## 10. CSS e Layout

### 10.1 Classes Utilitárias (Tailwind)

```css
/* feed-container */
@utility feed-container {
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  height: 100dvh;
  max-height: 100svh;
}

/* chapter-card */
@utility chapter-card {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  height: 100dvh;
  max-height: 100svh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* pages-container */
@utility pages-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  display: flex;
}

/* verses-page */
@utility verses-page {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  width: 100vw;
  flex-shrink: 0;
  overflow-y: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
```

### 10.2 Responsividade

- **Mobile:** `100dvh` no container, swipe natural, dots pequenos
- **Tablet/Desktop:** Mesma altura, conteúdos centralizados horizontalmente
- **Capítulos longos:** `overflow-y: auto` na verses-page para scroll interno se necessário
- **Barra de progresso:** backdrop-blur-sm e top:0 fixo

### 10.3 Acessibilidade

- `role="feed"` no container principal
- `aria-roledescription="feed de leitura"` para leitores de tela
- `aria-label` no header do capítulo
- Foco via teclado nos capítulos
- `prefers-reduced-motion` → scroll instantâneo sem smooth

---

## 11. Performance

### 11.1 Prevenção de Requests Desnecessários

| Situação | Impedido por |
|----------|-------------|
| fetchNextPage durante carregamento | `isFetchingNextPage` guard |
| fetchNextPage no fim | `hasNextPage` guard |
| POST/next repetido | Debounce 500ms |
| Duplicatas no array | Set de chapterIds |
| Re-render excessivo | `useRef` para Set, `useMemo` para chapters |

### 11.2 Memória

- `maxPages: 3` no useInfiniteQuery (só mantém 3 snapshots)
- Capítulos acumulados são objetos imutáveis, referências estáveis
- Sem storage de capítulos lidos no client (confia no servidor)

### 11.3 Smoothness

- scroll-behavior: smooth (nativo, sem JS)
- Transições CSS para dots (300ms)
- rAF no scroll horizontal
- Nenhuma animação JS pesada

---

## 12. Checklist de Qualidade Pré-Commit

- [ ] `bun run --filter=@versum/client check` (Biome)
- [ ] `bun run --filter=@versum/client typecheck` (tsc --noEmit)
- [ ] `bun run --filter=@versum/client test` passa
- [ ] Nenhum console.log / debug leftover
- [ ] Todos os componentes têm `"use client"` quando necessário
- [ ] Testes cobrem: loading, error, empty, dados, edge cases
- [ ] CSS snap testado em Chrome, Firefox, Safari (mobile + desktop)
- [ ] Keyboard navigation (ArrowDown/ArrowUp) funciona
- [ ] Navegação horizontal com scroll não interfere na vertical
- [ ] POST/next não dispara em loop (debounce testado)
- [ ] fetchNextPage não dispara sem necessidade (guards verificados)
