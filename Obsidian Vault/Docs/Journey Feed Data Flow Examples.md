---
title: "Journey Feed - Data Flow Examples"
section: Docs
tags: [versum, docs, journey-feed, client, data-flow, examples]
up: "[[Docs/_Index|Docs]]"
prev: "[[Docs/Journey Feed Client Architecture]]"
next: "[[Docs/Journey Feed - Progress Confirmation]]"
related: ["[[Docs/Journey Feed Client Architecture]]", "[[Docs/Apps/Client/Journey Feed Features]]", "[[Docs/Journey Feed - Progress Confirmation]]"]
depth: 1
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › 💻 [[Docs/Apps/Client/_Overview|Client]] › **Journey Feed Data Flow**

---

> [!info] Sobre este documento
> **Data:** 2026-06-27 · **Tipo:** Exemplos práticos com dados reais  
> **Áreas:** `apps/client/src/features/feed/journey/`  
> **Relacionado:** [[Docs/Journey Feed Client Architecture|Architecture]] · [[Docs/Apps/Client/Journey Feed Features|Features Index]]

---

# Journey Feed - Exemplos Práticos de Fluxo de Dados

## 1. Exemplo Completo: Requisição até Renderização

### 1.1 Requisição Backend

**Endpoint:** `GET /api/v1/readings/journey/feed?buffer-size=4`

**Resposta (exemplo real):**

```json
{
  "success": true,
  "message": "Feed retrieved successfully",
  "data": {
    "current": {
      "chapter": {
        "id": "ch-genesis-1",
        "number": 1,
        "totalVerses": 31
      },
      "book": {
        "name": "Gênesis",
        "slug": "genesis"
      },
      "verses": [
        {
          "id": "vs-genesis-1-1",
          "number": 1,
          "text": "No princípio, criou Deus os céus e a terra."
        },
        {
          "id": "vs-genesis-1-2",
          "number": 2,
          "text": "A terra, porém, estava sem forma e vazia; havia trevas sobre a face do abismo..."
        },
        {
          "id": "vs-genesis-1-3",
          "number": 3,
          "text": "Disse Deus: Haja luz; e houve luz."
        }
        // ... mais versículos
      ]
    },
    "nextItems": [
      {
        "chapter": { "id": "ch-genesis-2", "number": 2, "totalVerses": 25 },
        "book": { "name": "Gênesis", "slug": "genesis" },
        "verses": [ /* 25 versículos */ ]
      },
      {
        "chapter": { "id": "ch-genesis-3", "number": 3, "totalVerses": 24 },
        "book": { "name": "Gênesis", "slug": "genesis" },
        "verses": [ /* 24 versículos */ ]
      },
      {
        "chapter": { "id": "ch-genesis-4", "number": 4, "totalVerses": 26 },
        "book": { "name": "Gênesis", "slug": "genesis" },
        "verses": [ /* 26 versículos */ ]
      }
    ],
    "progress": {
      "chaptersRead": 1,
      "chaptersRemaining": 188,
      "totalChapters": 189,
      "percentComplete": 0.5291005291005291,
      "isAtEnd": false
    }
  }
}
```

### 1.2 Processamento em `useJourneyFeed()`

**Passo 1:** Recebe a resposta → passa por `extractChapters()`

```typescript
function extractChapters(response) {
  const data = response?.data;
  const items: FeedChapter[] = [];

  // current + nextItems = 4 capítulos total
  if (data.current) {
    items.push({
      id: "ch-genesis-1",
      bookName: "Gênesis",
      bookSlug: "genesis",
      chapterNumber: 1,
      totalVerses: 31,
      verses: [ /* 31 VerseData */ ]
    });
  }

  for (const next of data.nextItems) {
    items.push({
      id: "ch-genesis-2",
      bookName: "Gênesis",
      bookSlug: "genesis",
      chapterNumber: 2,
      totalVerses: 25,
      verses: [ /* 25 VerseData */ ]
    });
    // ... próximos itens
  }

  return items;
  // Resultado: [ch-genesis-1, ch-genesis-2, ch-genesis-3, ch-genesis-4]
}
```

**Passo 2:** Deduplicação (se houver segunda página)

```typescript
const chapters = useMemo(() => {
  const allPages = [
    // Página 1 (primeira requisição)
    [ch-genesis-1, ch-genesis-2, ch-genesis-3, ch-genesis-4],
    // Página 2 (segunda requisição - pode ter overlap)
    [ch-genesis-4, ch-genesis-5, ch-genesis-6, ch-genesis-7, ch-genesis-8]
  ];

  const seenIds = new Set<string>();
  const result: FeedChapter[] = [];

  for (const page of allPages) {
    for (const chapter of page) {
      if (!seenIds.has(chapter.id)) {  // Só ch-genesis-1 até 3 da 1ª, depois 5-8 da 2ª
        seenIds.add(chapter.id);
        result.push(chapter);
      }
    }
  }

  return result;
  // Resultado: [ch-1, ch-2, ch-3, ch-4, ch-5, ch-6, ch-7, ch-8]
}, [query.data?.pages]);
```

**Passo 3:** Progress é transformado

```typescript
function toProgress(apiProgress) {
  return {
    chaptersRead: apiProgress.chaptersRead,           // 1
    chaptersRemaining: apiProgress.chaptersRemaining, // 188
    totalChapters: apiProgress.totalChapters,         // 189
    percentComplete: apiProgress.percentComplete,     // 0.529
    isAtEnd: apiProgress.isAtEnd                      // false
  };
}
```

---

## 2. Exemplo: Renderização de ChapterView

### 2.1 Dados de Entrada

```typescript
const chapter: FeedChapter = {
  id: "ch-genesis-1",
  bookName: "Gênesis",
  bookSlug: "genesis",
  chapterNumber: 1,
  totalVerses: 31,
  verses: [
    { id: "vs-1-1", number: 1, text: "No princípio, criou Deus..." },
    { id: "vs-1-2", number: 2, text: "A terra, porém, estava..." },
    { id: "vs-1-3", number: 3, text: "Disse Deus: Haja luz..." },
    // ... 28 versículos mais
  ]
};

// Suponha que tela tem altura = 700px
const availableHeight = 700 - 40; // = 660px (padding)
```

### 2.2 Medição Invisível (measureRef)

Renderiza todos os versículos **invisíveis** e mede altura:

```
[visibility: hidden]
┌─────────────────┐
│ 1 No princípio... │ offsetHeight = 45px
├─────────────────┤
│ 2 A terra, porém... │ offsetHeight = 80px
├─────────────────┤
│ 3 Disse Deus... │ offsetHeight = 35px
├─────────────────┤
│ ...               │
└─────────────────┘

verseHeights = [45+16, 80+16, 35+16, ...] = [61, 96, 51, ...]
(+16 = margin-bottom)
```

### 2.3 Cálculo de Páginas (packPages)

```typescript
function packPages(verses, heights, availableHeight=660) {
  // heights = [61, 96, 51, 40, 70, 88, 45, 60, 52, ...]

  const pages: VersePage[] = [];
  let currentPage: VerseData[] = [];
  let usedHeight = 0;

  // Página 1:
  // verso 1: 61px, usedHeight=0 → cabe → usedHeight=61, currentPage=[verso1]
  // verso 2: 96px, usedHeight=61 → 61+96=157 cabe → usedHeight=157, currentPage=[verso1, verso2]
  // verso 3: 51px, usedHeight=157 → 157+51=208 cabe → usedHeight=208, currentPage=[verso1,2,3]
  // verso 4: 40px, usedHeight=208 → 208+40=248 cabe → usedHeight=248, currentPage=[verso1,2,3,4]
  // verso 5: 70px, usedHeight=248 → 248+70=318 cabe → usedHeight=318, currentPage=[verso1,2,3,4,5]
  // verso 6: 88px, usedHeight=318 → 318+88=406 cabe → usedHeight=406, currentPage=[verso1,2,3,4,5,6]
  // verso 7: 45px, usedHeight=406 → 406+45=451 cabe → usedHeight=451, currentPage=[verso1-6,7]
  // verso 8: 60px, usedHeight=451 → 451+60=511 cabe → usedHeight=511, currentPage=[verso1-8]
  // verso 9: 52px, usedHeight=511 → 511+52=563 cabe → usedHeight=563, currentPage=[verso1-9]
  // verso 10: 65px, usedHeight=563 → 563+65=628 cabe → usedHeight=628, currentPage=[verso1-10]
  // verso 11: 45px, usedHeight=628 → 628+45=673 > 660 NÃO CABE
  //           → Fecha página 1 e começa página 2
  //           pages.push({ startVerse: 1, endVerse: 10, verses: [verso1-10] })
  //           currentPage = [verso11], usedHeight = 45

  // Página 2: verso 11-20 (similar)
  // Página 3: verso 21-31

  return [
    { startVerse: 1, endVerse: 10, verses: [verso1...verso10] },
    { startVerse: 11, endVerse: 20, verses: [verso11...verso20] },
    { startVerse: 21, endVerse: 31, verses: [verso21...verso31] }
  ];
}
```

### 2.4 Renderização das Páginas

```html
<!-- ChapterView renderiza assim -->
<div style="...scrollSnapType: x mandatory; overflow-x: auto;">
  <!-- Renderização invisível (measureRef) - não visível -->
  <div style="visibility: hidden; position: absolute;">
    <p data-verse-id="vs-1-1"><sup>1</sup>No princípio...</p>
    <p data-verse-id="vs-1-2"><sup>2</sup>A terra...</p>
    <!-- todos os 31 versículos -->
  </div>

  <!-- Renderização visível (páginas) -->
  <VersesPage key="1-10" page={pages[0]}>
    <p><sup>1</sup>No princípio...</p>
    <p><sup>2</sup>A terra...</p>
    <!-- verso 10 -->
  </VersesPage>

  <VersesPage key="11-20" page={pages[1]}>
    <p><sup>11</sup>Então Deus disse...</p>
    <!-- verso 20 -->
  </VersesPage>

  <VersesPage key="21-31" page={pages[2]}>
    <p><sup>21</sup>E Deus viu...</p>
    <!-- verso 31 -->
  </VersesPage>
</div>
```

**No navegador:**
```
┌─────────────────┐
│ PÁGINA 1 (1-10) │ ← Visível, width=100vw
├─────────────────┤
│ PÁGINA 2 (11-20)│ ← Escondida (scroll para direita)
├─────────────────┤
│ PÁGINA 3 (21-31)│ ← Escondida (scroll para direita)
└─────────────────┘
```

---

## 3. Exemplo: IntersectionObserver Marcando Capítulo

### 3.1 Setup

```typescript
export function useActiveChapter(containerRef, { chapters, fetchNextPage }) {
  const [activeChapterId, setActiveChapterId] = useState(null);
  const debounceRef = useRef(null);
  const hasBeenReadRef = useRef(new Set());  // Track quais já foram marcados

  useEffect(() => {
    const container = containerRef.current;
    const chapterElements = container.querySelectorAll("[data-chapter-id]");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const chapterId = entry.target.getAttribute("data-chapter-id");

          // ENTRADA
          if (entry.isIntersecting) {
            setActiveChapterId(chapterId);  // Atualiza UI
          }
          // SAÍDA
          else {
            if (debounceRef.current) clearTimeout(debounceRef.current);

            debounceRef.current = setTimeout(async () => {
              // Aguardou 500ms e ainda está fora → marcar como lido
              if (hasBeenReadRef.current.has(chapterId)) return;  // Já marcado
              if (isAtEndRef.current) return;  // Fim da jornada

              hasBeenReadRef.current.add(chapterId);  // Marca como processado

              try {
                await fetch(POST_URL, { method: "POST", credentials: "include" });
                // Servidor avançou o ponteiro de leitura

                // Se perto do fim, busca próximos capítulos
                const exitedIndex = chapters.findIndex(c => c.id === chapterId);
                const nearEnd = exitedIndex >= chapters.length - 2;
                if (nearEnd) {
                  fetchNextPage();
                }
              } catch (e) {
                console.error("Erro ao marcar capítulo");
              }
            }, 500);
          }
        }
      },
      {
        threshold: 0.5,          // 50% visível = isIntersecting
        rootMargin: "-100px 0px" // Virtual margin
      }
    );

    chapterElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [chapters]);  // Recria observer quando chapters mudam (nova página)
}
```

### 3.2 Simulação de Scrolling

```
Tempo: 0ms
usuario.scroll()
  ↓
container tem 5 ChapterViews visíveis [ch-1, ch-2, ch-3, ch-4, ch-5]

Tempo: 50ms
usuario continua scrollando
  ↓
IntersectionObserver detecta:
  - ch-1: isIntersecting = false (saindo de cima)
  - ch-2: isIntersecting = true (entrando)
  - ch-3: isIntersecting = true (visível)
  - ch-4: isIntersecting = true (visível)
  - ch-5: isIntersecting = true (entrando)

Callbacks acionados:
  setActiveChapterId("ch-3")  // ch-3 é o mais centrado

Tempo: 150ms
usuario continua scrollando
  ↓
IntersectionObserver detecta:
  - ch-1: isIntersecting = false (já saiu)
  - ch-2: isIntersecting = false (saindo)
  - ch-3: isIntersecting = true (visível)
  - ch-4: isIntersecting = true (visível)
  - ch-5: isIntersecting = true (visível)
  - ch-6: isIntersecting = true (entrando)

Callback ch-2:
  hasBeenActiveRef.add("ch-2")  // Marca que foi visto
  debounce(500ms) → markChapterAsRead("ch-2")

Callback ch-6:
  setActiveChapterId("ch-4")  // novo ativo

Tempo: 650ms (150 + 500)
debounce de ch-2 ativa:
  POST /api/v1/readings/journey/next
  {
    "success": true,
    "data": { "chaptersRead": 2, "chaptersRemaining": 187, ... }
  }

Servidor avançou: chaptersRead = 2 (foi 1, agora é 2)
nearEnd check:
  exitedIndex = chapters.findIndex(c => c.id === "ch-2") = 1
  nearEnd = 1 >= (5 - 2) ? 1 >= 3 ? false
  // Não está perto do fim, não faz fetchNextPage

Tempo: 1000ms
usuario segue scrollando
  ↓
Mesmo padrão: ch-3 sai → debounce → POST

Tempo: 2000ms
usuario chegou perto do final
  ↓
IntersectionObserver detecta:
  - ch-20: isIntersecting = false (saindo)
  - ch-21: isIntersecting = true
  - ch-22: isIntersecting = true
  - ch-23: isIntersecting = true

exitedIndex = 20
nearEnd = 20 >= (23 - 2) ? 20 >= 21 ? false

Tempo: 3000ms
  - ch-21: isIntersecting = false (saindo)
  - ch-22: isIntersecting = true (visível)
  - ch-23: isIntersecting = true (visível)
  - ch-24: isIntersecting = true (entrando)

exitedIndex = 21
nearEnd = 21 >= (24 - 2) ? 21 >= 22 ? false

Tempo: 3500ms
ch-21 debounce ativa:
  POST /api/v1/readings/journey/next
  Server: chaptersRead = 21

Tempo: 4000ms
  - ch-22: isIntersecting = false (saindo)
  - ch-23: isIntersecting = true
  - ch-24: isIntersecting = true
  - ch-25: isIntersecting = true

exitedIndex = 22
nearEnd = 22 >= (25 - 2) ? 22 >= 23 ? false

Tempo: 4500ms
ch-22 debounce ativa + POST

Tempo: 5000ms
  - ch-23: isIntersecting = false (saindo)
  - ch-24: isIntersecting = true
  - ch-25: isIntersecting = true

exitedIndex = 23
nearEnd = 23 >= (25 - 2) ? 23 >= 23 ? true ✓

ATIVA FETCHNEXTPAGE!
  GET /api/v1/readings/journey/feed?buffer-size=4
  Backend retorna: ch-25, ch-26, ch-27, ch-28, ch-29 (novos capítulos!)

useJourneyFeed():
  - Tira duplicatas (ch-25 pode estar em ambas)
  - Adiciona ch-26, ch-27, ch-28, ch-29 ao array
  - chapters agora tem 29 itens

ChapterView renderizam para ch-26, ch-27, ch-28, ch-29
```

---

## 4. Exemplo: Keyboard Navigation

### 4.1 Estrutura DOM

```html
<div ref={containerRef} style="...overflow-y: scroll;">
  <div data-chapter-id="ch-genesis-1">Gênesis 1</div>
  <div data-chapter-id="ch-genesis-2">Gênesis 2</div>
  <div data-chapter-id="ch-genesis-3">Gênesis 3</div>
  <div data-chapter-id="ch-genesis-4">Gênesis 4</div>
  <div data-chapter-id="ch-genesis-5">Gênesis 5</div>
</div>
```

### 4.2 Simulação de Keypress

```
Usuário vê capítulos 2 e 3 (centro em ch-2)
  ↓
Pressiona ArrowDown
  ↓
getVisibleChapterIndex() calcula:
  - ch-2: distância do centro = 100px
  - ch-3: distância do centro = 150px
  - ch-4: distância do centro = 300px
  currentIndex = 1 (ch-2 é o mais próximo)
  ↓
nextIndex = Math.min(1 + 1, 5 - 1) = 2
  ↓
scrollToElement(container, chapters[2], smooth=true)
  container.scrollTo({ top: ch-3.offsetTop, behavior: "smooth" })
  ↓
Container rola suavemente para ch-3

---

Usuário agora vê ch-3 e ch-4 (centro em ch-3)
  ↓
Pressiona ArrowUp
  ↓
currentIndex = 2
prevIndex = Math.max(2 - 1, 0) = 1
  ↓
scrollToElement(container, chapters[1], smooth=true)
  ↓
Container rola suavemente de volta para ch-2
```

---

## 5. Exemplo Completo: State Evolution

### Timeline de um Usuário Lendo

```
T=0s: App inicia
  chapters: []
  progress: null
  activeChapterId: null
  isLoading: true
  → Renderiza: ChapterSkeleton ×3

T=0.5s: GET /feed retorna com ch-1, ch-2, ch-3, ch-4
  chapters: [ch-1, ch-2, ch-3, ch-4]
  progress: { chaptersRead: 1, chaptersRemaining: 188, ... }
  activeChapterId: null
  isLoading: false
  → Renderiza: ChapterView ×4

T=1s: Tela renderizou, IntersectionObserver montou
  activeChapterId: "ch-1"  (ch-1 está intersecting)
  → ChapterHeader mostra: "Gênesis 1:1-10" (página 1 de 3)

T=5s: Usuário rola lentamente
  activeChapterId: "ch-1" ou "ch-2" (dependendo de visibilidade)
  → UI atualiza dinamicamente

T=10s: Usuário sai de ch-1, desce para ch-2
  ch-1: isIntersecting = false
  debounce(500ms) inicia
  → Aguardando...

T=10.5s: Debounce ativa
  POST /api/v1/readings/journey/next → "ch-1 marcado como lido"
  exitedIndex = 0, nearEnd = 0 >= (4-2)? false
  → Não fetcha próxima página (ainda tem buffer)

T=15s: Usuário em ch-3
  activeChapterId: "ch-3"
  → ChapterHeader mostra página de ch-3

T=20s: Usuário pressiona ArrowDown 3 vezes rápido
  scrollToElement → ch-4
  scrollToElement → ch-5 (fetched!)
  scrollToElement → ch-6 (fetched!)
  → Renderiza novos capítulos

T=25s: Usuário em ch-7, chegando perto do fim do buffer
  activeChapterId: "ch-7"
  → exitedIndex ≈ 6, nearEnd = 6 >= (7-2)? true
  → GET /feed fetcha ch-8, ch-9, ch-10, ch-11, ch-12

T=26s: Nova página chega
  chapters: [ch-1, ch-2, ..., ch-12]  (deduplicadas)
  isFetchingNextPage: false
  hasNextPage: true
  → ChapterView renderiza para novos capítulos

T=100s: Usuário em ch-189 (último capítulo)
  activeChapterId: "ch-189"
  progress: { ..., isAtEnd: true }
  → FeedEmpty renderiza ("Parabéns, completou!")
```

---

## 6. Verificação Rápida: Como Ler o Código

Quando vendo o código, procure por:

1. **Entrada de dados:**
   - `useJourneyFeed()` → GET /feed
   - `extractChapters()` → Transforma resposta

2. **Estado:**
   - `chapters: FeedChapter[]` → Lista de capítulos
   - `activeChapterId: string` → Qual está visível
   - `progress: FeedProgress` → Progresso do usuário

3. **Renderização:**
   - `chapters.map(ch => <ChapterView>)` → Renderiza lista
   - `ChapterView` → Calcula páginas e renderiza
   - `VersesPage` → Renderiza versículos

4. **Efeitos:**
   - `useActiveChapter()` → IntersectionObserver, POST /next
   - `useKeyboardNavigation()` → Arrow keys
   - `useChapterPagination()` → Página horizontal

Tudo coordenado via `FeedProvider` que centraliza estado.

---

◀ [[Docs/Journey Feed Client Architecture|Architecture]] · [[Docs/Journey Feed - Progress Confirmation|Progress Confirmation]] ▶
