# Bible Search — Design Spec

**Data:** 2026-06-28
**Escopo:** Algoritmo de autocomplete de referências bíblicas na rota `/search`
**Fora do escopo:** Rotas SSG (`/bible/books/...`), full-text search por conteúdo de versículo, busca por usuários (`@username`)

---

## Contexto

A página `/search` existe com layout básico (GSAP + Input), mas sem lógica de busca. O objetivo é implementar um autocomplete de referências bíblicas (ex: `Gn 1:1`, `Gênesis 1:10-13`) que guia o usuário até uma referência válida com mínima fricção. O client orquestra as chamadas REST existentes — sem endpoint de search novo na API.

---

## Arquitetura

### Fontes de dados

| Dado | Origem | Cache |
|------|--------|-------|
| Lista de 73 livros | `GET /books?limit=100` | React Query `staleTime: Infinity` + Redis 5min |
| `totalVerses` do capítulo | `GET /books/{slug}/chapters/{n}` (lazy, só no verse stage) | React Query 5min + Redis 5min |
| Navegação pós-submit | `router.push(rota SSG)` | — sem request — |

**Máximo 2 requests por sessão de busca.**

### Estágios do parser

```
"Gên"           → { stage: 'book',    partial: 'Gên' }
"Gênesis 1"     → { stage: 'chapter', book: Book, partial: '1' }
"Gênesis 1:"    → { stage: 'verse',   book: Book, chapter: 1, partial: '' }
"Gênesis 1:10"  → { stage: 'verse',   book: Book, chapter: 1, partial: '10' }
```

### Regex do parser

```typescript
const REF_REGEX = /^(?<bookPart>[^0-9:]+?)(?:\s+(?<chapterPart>\d+)(?::(?<versePart>\d*))?)?$/
```

---

## Algoritmo de matching

### Normalização

`normalize(str)` → remove acentos + lowercase. Permite `"Genesis"` → Gênesis, `"gn"` → Gênesis.

### Book matcher — ranking

1. Slug exato (`"gn" === book.slug`)
2. Slug prefixo
3. `normalize(book.niceName).startsWith(normalize(partial))`
4. `normalize(book.name).startsWith(normalize(partial))`

Retorna `Book[]`, máx. 5.

### Chapter suggestions

```typescript
generateChapterSuggestions(book, partial): number[]
// filtrar 1..book.totalChapters onde String(n).startsWith(partial)
// partial="" → primeiros 8 capítulos
```

### Verse suggestions

```typescript
generateVerseSuggestions(totalVerses, partial): number[]
// filtrar 1..totalVerses onde String(n).startsWith(partial)
// partial="" → primeiros 8 versos
```

### `justCompleted` lock

Após Tab/Enter completar uma sugestão: `justCompleted = true` → sem novas sugestões até próximo keystroke manual.

---

## Estrutura de arquivos

```
src/features/search/
├── components/
│   ├── search-input.tsx        # Input controlado + forwardRef (GSAP compat)
│   ├── suggestion-list.tsx     # Dropdown, role="listbox"
│   ├── suggestion-item.tsx     # Item com texto destacado (match em bold)
│   └── autocomplete-hint.tsx   # Ícone Enter (mobile) / Tab (desktop)
├── hooks/
│   ├── use-bible-search.ts     # Hook principal — estado + lógica
│   ├── use-books-query.ts      # GET /books?limit=100, staleTime Infinity
│   └── use-chapter-query.ts    # GET /books/{slug}/chapters/{n}, enabled flag
├── utils/
│   ├── bible-reference-parser.ts
│   ├── book-matcher.ts
│   ├── normalize-text.ts
│   ├── chapter-suggestions.ts
│   └── verse-suggestions.ts
├── types/
│   └── index.ts
└── __tests__/
    ├── bible-reference-parser.test.ts
    ├── book-matcher.test.ts
    ├── chapter-suggestions.test.ts
    ├── verse-suggestions.test.ts
    └── use-bible-search.test.ts
```

### Interface pública do hook

```typescript
const {
  inputValue,
  onInputChange,
  suggestions,      // Suggestion[]
  activeSuggestion, // índice selecionado
  onKeyDown,        // Tab/Enter/Arrow/Escape
  onSubmit,
  stage,
  isLoadingVerses,
} = useBibleSearch()
```

---

## UX e teclado

| Ação | Mobile | Desktop |
|------|--------|---------|
| Completar sugestão | `Enter` | `Tab` |
| Navegar sugestões | ▲ ▼ | ▲ ▼ |
| Submeter busca | `Enter` sem sugestão ativa | `Enter` sem sugestão ativa |
| Fechar lista | `Escape` | `Escape` |

**Ícones Phosphor:**
- Mobile: `<ArrowElbowDownLeft />` — "Enter para completar"
- Desktop: `<ArrowBendUpLeft />` — "Tab para completar"

Detecção via `pointer: coarse` media query em `useEffect` (sem hydration mismatch).

**Highlight:** texto digitado aparece em bold na sugestão, match normalizado mas exibe original com acento.

**Acessibilidade:** `aria-autocomplete="list"`, `aria-expanded`, `aria-activedescendant`, `role="listbox"`, `role="option"`.

---

## Integração na page.tsx existente

O layout, GSAP e animações são preservados. Apenas o `<Input>` é substituído por `<SearchInput />` que usa `forwardRef`.

---

## Navegação pós-submit

```
book only    → /bible/books/{slug}
+ chapter    → /bible/books/{slug}/chapters/{n}
+ verse      → /bible/books/{slug}/chapters/{n}/verses/{v}
```

Rotas SSG são escopo separado. O `router.push` funciona assim que as páginas existirem.

---

## Testes

### Funções puras — cobertura 100%

- `bible-reference-parser`: todos os estágios + edge cases (vazio, só número, último verso Ap 22:21)
- `book-matcher`: slug exato, prefix accent-insensitive, case-insensitive, sem match, ranking múltiplos
- `chapter-suggestions`: prefix com todos os tamanhos de partial, bounded por totalChapters
- `verse-suggestions`: idem, bounded por totalVerses

### Hook — cenários principais

- Digitar `"Gn"` → suggestions contém Gênesis
- Digitar `"Gênesis 1"` → stage chapter, sugestões de capítulo corretas
- Tab/Enter → inputValue atualizado, justCompleted true
- Próximo keystroke → justCompleted false, novas sugestões
- Submit com referência completa → router.push chamado com rota correta

### Orval DAL utilizado

- `useGetApiV1PublicBibleBooks` (books query)
- `useGetApiV1PublicBibleBooksDynamicIdChaptersNumber` (chapter query, lazy)
