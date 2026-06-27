---
title: "Journey Feed — Client Implementation"
section: "Docs"
subsection: "Apps"
tags: [versum, client, journey-feed, implementation]
up: "[[Docs/Apps/Client/_Overview]]"
related: ["[[Docs/Decisions/Journey Feed - Progress Confirmation]]", "[[Docs/API Development]]"]
depth: 3
---

# 📱 Journey Feed — Client Implementation

> [!quote]
> Implementação do feed de leitura bíblica com scroll snap, paginação adaptativa e navegação por gesto.

**Junho 2026** · `apps/client/src/features/feed/journey/` · [[https://github.com/eduardoaugustolb/versum/pull/25|PR #25]]

---

## 1. Visão Geral

O **Journey Feed** é a experiência principal de leitura bíblica do Versum. O usuário percorre a Bíblia sequencialmente (Gênesis ao Apocalipse) em um feed vertical com snap scrolling estilo TikTok. Cada capítulo ocupa uma tela inteira e é dividido em páginas horizontais de versículos.

Diferente de apps de leitura tradicionais (rolagem infinita ou paginação simples), o Journey Feed foi projetado para ser **imersivo** e **navegável por gestos**: scroll vertical troca de capítulo, scroll horizontal navega entre páginas de versículos.

---

## 2. Tech Stack

| Camada | Tecnologia |
|:--|:--|
| **Renderização** | React 19 + Next.js 16 (App Router, Server Components) |
| **State** | TanStack Query v5 (`useInfiniteQuery`, `useMutation`) |
| **Scroll** | CSS Scroll Snap (native), ResizeObserver, IntersectionObserver |
| **Medição** | DOM measurement (offsetHeight) com greedy packing |
| **Styling** | Tailwind CSS v4 + inline styles (scroll-snap properties) |

---

## 3. Estrutura de Arquivos

```
features/feed/journey/                18 arquivos
├── index.ts                           ← barrel
├── types.ts                           ← VerseData, FeedChapter, etc.
├── utils/
│   ├── paginate-verses.ts             ← fallback estático
│   └── paginate-verses.test.ts
├── hooks/
│   ├── use-journey-feed.ts            ← useInfiniteQuery + dedup
│   ├── use-journey-progress.ts        ← mutation de progresso
│   ├── use-active-chapter.ts          ← IntersectionObserver
│   ├── use-chapter-pagination.ts      ← scrollX + rAF
│   ├── use-keyboard-navigation.ts     ← ArrowDown/Up
│   ├── use-get-journey-status.ts      ← query de status
│   └── index.ts
├── components/
│   ├── journey-feed.tsx               ← container vertical snap
│   ├── chapter-view.tsx               ← medição + paginação
│   ├── chapter-header.tsx             ← "Gênesis 1 • 1-7 ●○○○○"
│   ├── verses-page.tsx                ← página horizontal
│   ├── page-dots.tsx                  ← indicador de página
│   ├── feed-empty.tsx                 ← estado final
│   ├── chapter-skeleton.tsx           ← loading
│   └── index.ts
├── contexts/
│   ├── feed-context.tsx               ← provider unificado
│   └── feed-context.test.tsx
└── + 6 arquivos de teste
```

---

## 4. Fluxos de Dados

### 4.1 Carregamento Inicial

```
JourneyFeed monta
  ↓
useJourneyFeed() → useInfiniteQuery(queryKey: ['journey-feed'])
  ↓
fetchFeed({ "buffer-size": 4 }) → GET /api/v1/readings/journey/feed
  ↓
API retorna { data: { current, nextItems, progress } }
  ↓
extractChapters() extrai current + nextItems, dedup via Set<chapterId>
  ↓
chapter-view.tsx:
  1. Renderiza probe oculto com TODOS os versículos
  2. Mede offsetHeight individual (+ margin-bottom)
  3. Empacotamento guloso até limite do container
  4. setPages(resultado)
  ↓
Renderiza VersesPage para cada página calculada
```

### 4.2 Scroll Vertical (entre capítulos)

```
Usuário scrola verticalmente
  ↓
CSS scroll-snap-type: y mandatory → navegação nativa
  ↓
useActiveChapter (IntersectionObserver, threshold: 0.5)
  → detecta qual capítulo está em view
  ↓
Se capítulo saiu de view:
  → setTimeout 500ms (debounce)
  → POST /api/v1/readings/journey/next (marca como lido)
  ↓
Se activeIndex >= chapters.length - 2:
  → fetchNextPage()
```

### 4.3 Scroll Horizontal (dentro do capítulo)

```
Usuário scrola horizontalmente
  ↓
useChapterPagination:
  → addEventListener('scroll') + requestAnimationFrame
  → activePage = Math.round(scrollLeft / clientWidth)
  ↓
ChapterHeader re-renderiza com página atual e indicadores
```

### 4.4 Navegação por Teclado

```
useKeyboardNavigation:
  → document.addEventListener('keydown')

ArrowDown: scrolla para próximo capítulo
ArrowUp: scrolla para capítulo anterior
ArrowLeft/Right: nativo via CSS
prefers-reduced-motion: scroll-behavior: auto
```

---

## 5. Algoritmo de Paginação Adaptativa

### Problema

Versículos bíblicos têm comprimento extremamente variável:
- João 11:35 ("Jesus chorou.") = 2 palavras
- Salmo 119 = versículos de 30+ palavras

**Abordagens que falhavam:**
- **Versículos fixos por página** → ignora variação, causa overflow
- **Amostragem** (primeiros 5) → se primeiros são curtos, versículos longos estouram
- **Altura total / container** → não distribui corretamente

### Solução: Greedy Packing com Medição Individual

```markdown
1. Renderiza TODOS os versículos em <div> oculto
   (position: absolute, visibility: hidden)

2. Para cada <p data-verse-id>, mede:
   totalHeight = element.offsetHeight + 16  // + margin-bottom

3. Calcula altura por página:
   availableHeight = container.clientHeight - 40

4. Empacotamento guloso:
   para cada versículo:
     se (usedHeight + totalHeight > availableHeight) E página não vazia:
       finaliza página, inicia nova
     adiciona versículo à página
     usedHeight += totalHeight
```

### Propriedades

| Propriedade | Detalhe |
|:--|:--|
| **📏 Precisão real** | Cada versículo medido no DOM com texto completo, fonte, line-height exatos |
| **🔄 Adaptativo** | Funciona com qualquer tamanho de fonte ou zoom do navegador |
| **🛡️ Sem overflow** | Greedy packing respeita limite de altura |
| **📐 Recalcula** | ResizeObserver dispara nova medição quando janela muda |

---

## 6. Decisões Arquiteturais

### 6.1 Por que medir no DOM em vez de estimar?

**Decisão:** Renderizar todos em probe `position: absolute; visibility: hidden` com mesmo padding que `VersesPage`.

**Custo:** ~2x DOM nodes. Para Salmo 119 (176 versículos) = ~350 nodes — irrelevante. Ganho em precisão supera amplamente o custo.

### 6.2 Por que CSS Scroll Snap?

Snap com JS é frágil, propenso a race conditions. CSS `scroll-snap-type` é nativo, roda no compositor thread, funciona em touch/trackpad/mouse sem código.

### 6.3 Por que IntersectionObserver?

`onScroll` dispara centenas de eventos/segundo. `IntersectionObserver` é passivo, só notifica quando estado muda — perfeito para detectar "capítulo X entrou/saiu".

### 6.4 Por que inline styles para snap/pagination?

Tailwind CSS v4 compila `@utility` classes em build. Classes para scroll-snap eram inconsistentes. Inline styles garantem que propriedades **sempre** estejam presentes.

### 6.5 Por que direct fetch() em vez de Orval hook?

`useJourneyFeed.ts` usa `fetch()` direto com URL do Orval (`getGetApiV1ReadingsJourneyFeedUrl`) mas não o hook gerado. Razão: `useInfiniteQuery` precisa de controle fino sobre `queryFn`, `getNextPageParam`, `maxPages` — código gerado não expõe adequadamente.

### 6.6 Por que ref pattern?

Sem React Compiler, funções como `markPreviousAsRead` seriam recriadas a cada render. Se usadas em `useEffect`, causariam re-subscriptions. **Solução:** Armazenar em refs (`isAtEndRef`, `chaptersRef`) e ler como `.current` dentro do effect. `useEffect` depende só de `[containerRef]`.

### 6.7 Por que remover useCallback/useMemo manual?

Projeto usa **React Compiler** que auto-memoiza. `useCallback`/`useMemo` explícitos tornam-se ruído.

---

## 7. Tratamento de Erros

| Cenário | Proteção |
|:--|:--|
| **Erro de rede** | `retry: 2` (3 tentativas). Persistindo: exibe "Tentar novamente" |
| **Erro no POST/next** | Apenas log (operação background). Próximo scroll tenta novamente |
| **Timeout** | `AbortSignal` herdado de TanStack Query |
| **401 (sessão expirada)** | Middleware de autenticação redireciona para /login |

---

## 8. Prevenção de Bugs

| Cenário | Proteção |
|:--|:--|
| `fetchNextPage` durante carregamento | `isFetchingNextPage` guard |
| `fetchNextPage` no fim da Bíblia | `hasNextPage` guard (progress.isAtEnd) |
| POST/next repetido | Debounce 500ms + guard isAtEnd |
| Duplicatas em capítulos | `Set<chapterId>` no acumulador |
| Probe conta como página | `pageCount` de `pages.length`, não `children.length` |
| Scroll horizontal interfere no vertical | Containers separados |
| Container flex sem altura | `min-h-0` no container de versículos |

---

## 9. Performance

- **maxPages: 3** — mantém só 3 snapshots na memória
- **React Compiler** — auto-memoiza; sem `useCallback`/`useMemo` manual
- **Ref pattern** — evita re-subscriptions
- **requestAnimationFrame** — throttling natural de scroll horizontal
- **scroll-behavior: smooth** nativo
- **staleTime: 60s** — evita refetch desnecessário
- **Probe oculto** — renderizado mas não visível (visibility: hidden)

---

## 10. Testes (67 testes, 14 arquivos)

| Módulo | Cobertura |
|:--|:--|
| **paginate-verses** | 6 casos: vazio, 2v, 7v, 176v, vpp > total |
| **use-chapter-pagination** | Scroll detection, clamping, empty container |
| **use-active-chapter** | Mock IntersectionObserver, buffer checks |
| **feed-context** | Provider, useFeed, erro fora do provider |
| **Componentes** | feed-empty, skeleton, page-dots, header, verses-page |

---

## 11. Próximos Passos

- [ ] Testar paginação com dados reais (verificar distribuição multi-linha)
- [ ] Verificar layout desktop (navbar, altura total)
- [ ] Adicionar testes de integração com API mockada

---

◀ [[Docs/Apps/Client/_Overview|Overview]] · [[Docs/Apps/Client/Components|Components]] ▶
