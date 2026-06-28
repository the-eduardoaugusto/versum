# Bible Seed Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o seed da bíblia na CLI para buscar os 73 JSONs diretamente do repositório público biblia-db via GitHub raw API, eliminando a dependência de arquivo JSON local.

**Architecture:** Lista canônica hardcoded de 73 slugs (46 AT + 27 NT) mapeia para URLs raw do GitHub. Um fetch paralelo com `Promise.allSettled` coleta todos os livros; um integrity check valida a completude antes de qualquer escrita no banco. O normalizer é estendido para suportar o formato `{ livro, capitulos }` do biblia-db.

**Tech Stack:** Bun runtime, TypeScript, Drizzle ORM, prompts (CLI interativa). Fetch nativo do Bun para HTTP.

## Global Constraints

- Runtime: Bun (usar `fetch` nativo, não `node-fetch`)
- Todos os arquivos TypeScript devem passar em `bun --filter '*' typecheck`
- Lint via Biome: `bun --filter '*' lint` não pode ter novos erros
- Testes rodam com Vitest via `bun --filter '*' test`
- Base URL raw: `https://raw.githubusercontent.com/Dancrf/biblia-db/refs/heads/main/`
- Diretório AT: `antigotestamento/`, NT: `novotestamento/`
- Total esperado: **73 livros** (46 AT + 27 NT)
- Arquivo de trabalho: `apps/api/src/cli/modules/bible/`

---

## File Map

| Ação | Arquivo |
|---|---|
| **Criar** | `seed/bible-books.constants.ts` |
| **Criar** | `seed/bible-fetcher.ts` |
| **Modificar** | `bible-json-normalize.ts` |
| **Modificar** | `seed/seed.action.ts` |
| **Modificar** | `seed/seed.menus.ts` |
| **Modificar** | `bible.action.ts` |
| **Deletar** | `seed/helpers/find-cli-output-files.ts` |

---

### Task 1: Criar `bible-books.constants.ts` com lista canônica dos 73 livros

**Files:**
- Create: `apps/api/src/cli/modules/bible/seed/bible-books.constants.ts`

**Interfaces:**
- Produces:
  ```ts
  export type BibleBookEntry = { slug: string; testament: "OLD" | "NEW" }
  export const BIBLE_BOOKS: BibleBookEntry[]  // length === 73
  export const EXPECTED_BOOK_COUNT = 73
  export const BASE_RAW_URL = "https://raw.githubusercontent.com/Dancrf/biblia-db/refs/heads/main"
  ```

- [ ] **Step 1: Criar o arquivo de constantes**

Criar `apps/api/src/cli/modules/bible/seed/bible-books.constants.ts`:

```ts
export type BibleBookEntry = {
  slug: string;
  testament: "OLD" | "NEW";
};

export const BASE_RAW_URL =
  "https://raw.githubusercontent.com/Dancrf/biblia-db/refs/heads/main";

export const EXPECTED_BOOK_COUNT = 73;

export const BIBLE_BOOKS: BibleBookEntry[] = [
  // Antigo Testamento (46)
  { slug: "1ma", testament: "OLD" },
  { slug: "1pa", testament: "OLD" },
  { slug: "1rs", testament: "OLD" },
  { slug: "1sm", testament: "OLD" },
  { slug: "2ma", testament: "OLD" },
  { slug: "2pa", testament: "OLD" },
  { slug: "2rs", testament: "OLD" },
  { slug: "2sm", testament: "OLD" },
  { slug: "ab", testament: "OLD" },
  { slug: "ag", testament: "OLD" },
  { slug: "am", testament: "OLD" },
  { slug: "ba", testament: "OLD" },
  { slug: "cc", testament: "OLD" },
  { slug: "dn", testament: "OLD" },
  { slug: "dt", testament: "OLD" },
  { slug: "ees", testament: "OLD" },
  { slug: "esd", testament: "OLD" },
  { slug: "est", testament: "OLD" },
  { slug: "eus", testament: "OLD" },
  { slug: "ex", testament: "OLD" },
  { slug: "ez", testament: "OLD" },
  { slug: "gn", testament: "OLD" },
  { slug: "hc", testament: "OLD" },
  { slug: "is", testament: "OLD" },
  { slug: "jdi", testament: "OLD" },
  { slug: "je", testament: "OLD" },
  { slug: "jl", testament: "OLD" },
  { slug: "jn", testament: "OLD" },
  { slug: "job", testament: "OLD" },
  { slug: "js", testament: "OLD" },
  { slug: "ju", testament: "OLD" },
  { slug: "lm", testament: "OLD" },
  { slug: "lv", testament: "OLD" },
  { slug: "mic", testament: "OLD" },
  { slug: "ml", testament: "OLD" },
  { slug: "na", testament: "OLD" },
  { slug: "ne", testament: "OLD" },
  { slug: "nm", testament: "OLD" },
  { slug: "os", testament: "OLD" },
  { slug: "ps", testament: "OLD" },
  { slug: "pv", testament: "OLD" },
  { slug: "rt", testament: "OLD" },
  { slug: "sa", testament: "OLD" },
  { slug: "so", testament: "OLD" },
  { slug: "tob", testament: "OLD" },
  { slug: "zc", testament: "OLD" },
  // Novo Testamento (27)
  { slug: "1co", testament: "NEW" },
  { slug: "1jo", testament: "NEW" },
  { slug: "1pe", testament: "NEW" },
  { slug: "1tm", testament: "NEW" },
  { slug: "1ts", testament: "NEW" },
  { slug: "2co", testament: "NEW" },
  { slug: "2jo", testament: "NEW" },
  { slug: "2pe", testament: "NEW" },
  { slug: "2tm", testament: "NEW" },
  { slug: "2ts", testament: "NEW" },
  { slug: "3jo", testament: "NEW" },
  { slug: "act", testament: "NEW" },
  { slug: "ap", testament: "NEW" },
  { slug: "cl", testament: "NEW" },
  { slug: "ef", testament: "NEW" },
  { slug: "fm", testament: "NEW" },
  { slug: "fp", testament: "NEW" },
  { slug: "gl", testament: "NEW" },
  { slug: "hb", testament: "NEW" },
  { slug: "jda", testament: "NEW" },
  { slug: "jo", testament: "NEW" },
  { slug: "lc", testament: "NEW" },
  { slug: "mc", testament: "NEW" },
  { slug: "mt", testament: "NEW" },
  { slug: "rm", testament: "NEW" },
  { slug: "tg", testament: "NEW" },
  { slug: "tt", testament: "NEW" },
];
```

- [ ] **Step 2: Verificar typecheck**

```bash
cd apps/api && bun typecheck
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/cli/modules/bible/seed/bible-books.constants.ts
git commit -m "feat(cli/bible): add canonical 73-book constants for biblia-db"
```

---

### Task 2: Estender normalizer para suportar formato `{ livro, capitulos }` do biblia-db

**Files:**
- Modify: `apps/api/src/cli/modules/bible/bible-json-normalize.ts`
- Test: `apps/api/src/cli/modules/bible/bible-json-normalize.test.ts` (criar)

**Interfaces:**
- Consumes: `BibleBookEntry` de `./seed/bible-books.constants`
- Produces:
  ```ts
  export function normalizeLivroBibliaDB(
    raw: unknown,
    entry: BibleBookEntry,
    order: number,
  ): NormalizedBook
  ```

- [ ] **Step 1: Escrever o teste com o formato exato do biblia-db**

Criar `apps/api/src/cli/modules/bible/bible-json-normalize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeLivroBibliaDB } from "./bible-json-normalize";

const rawGn = {
  livro: "Gênesis",
  capitulos: [
    {
      capitulo: 1,
      versiculos: [
        { numero: 1, texto: "No princípio criou Deus os céus e a terra." },
        { numero: 2, texto: "A terra era sem forma e vazia." },
      ],
    },
    {
      capitulo: 2,
      versiculos: [{ numero: 1, texto: "Foram, pois, acabados os céus." }],
    },
  ],
};

describe("normalizeLivroBibliaDB", () => {
  it("normalizes name and niceName from livro field", () => {
    const result = normalizeLivroBibliaDB(
      rawGn,
      { slug: "gn", testament: "OLD" },
      0,
    );
    expect(result.name).toBe("Gênesis");
    expect(result.niceName).toBe("Gênesis");
  });

  it("uses slug from entry", () => {
    const result = normalizeLivroBibliaDB(
      rawGn,
      { slug: "gn", testament: "OLD" },
      0,
    );
    expect(result.slug).toBe("gn");
  });

  it("sets order as 1-based index", () => {
    const result = normalizeLivroBibliaDB(
      rawGn,
      { slug: "gn", testament: "OLD" },
      0,
    );
    expect(result.order).toBe(1);
  });

  it("maps capitulos to chapters with correct shape", () => {
    const result = normalizeLivroBibliaDB(
      rawGn,
      { slug: "gn", testament: "OLD" },
      0,
    );
    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].chapter).toBe(1);
    expect(result.chapters[0].verses).toHaveLength(2);
    expect(result.chapters[0].verses[0].verse).toBe(1);
    expect(result.chapters[0].verses[0].text).toBe(
      "No princípio criou Deus os céus e a terra.",
    );
  });

  it("maps versiculos to verses with numero → verse and texto → text", () => {
    const result = normalizeLivroBibliaDB(
      rawGn,
      { slug: "gn", testament: "OLD" },
      0,
    );
    const firstVerse = result.chapters[0].verses[0];
    expect(firstVerse.verse).toBe(1);
    expect(firstVerse.text).toBe("No princípio criou Deus os céus e a terra.");
  });

  it("throws if raw is not an object", () => {
    expect(() =>
      normalizeLivroBibliaDB("invalid", { slug: "gn", testament: "OLD" }, 0),
    ).toThrow();
  });

  it("throws if livro is missing or empty", () => {
    expect(() =>
      normalizeLivroBibliaDB(
        { livro: "", capitulos: [] },
        { slug: "gn", testament: "OLD" },
        0,
      ),
    ).toThrow();
  });

  it("throws if capitulos is not an array", () => {
    expect(() =>
      normalizeLivroBibliaDB(
        { livro: "Gênesis", capitulos: {} },
        { slug: "gn", testament: "OLD" },
        0,
      ),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

```bash
cd apps/api && bun test src/cli/modules/bible/bible-json-normalize.test.ts
```

Esperado: FAIL — `normalizeLivroBibliaDB is not a function` ou similar.

- [ ] **Step 3: Implementar `normalizeLivroBibliaDB` em `bible-json-normalize.ts`**

Adicionar ao final de `apps/api/src/cli/modules/bible/bible-json-normalize.ts` (manter todo o código existente intacto):

```ts
import type { BibleBookEntry } from "./seed/bible-books.constants";

interface RawLivroBibliaDB {
  livro: string;
  capitulos: {
    capitulo: number;
    versiculos: { numero: number; texto: string }[];
  }[];
}

function isRawLivroBibliaDB(raw: unknown): raw is RawLivroBibliaDB {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  if (typeof r.livro !== "string" || r.livro.trim() === "") return false;
  if (!Array.isArray(r.capitulos)) return false;
  return true;
}

export function normalizeLivroBibliaDB(
  raw: unknown,
  entry: BibleBookEntry,
  index: number,
): NormalizedBook {
  if (!isRawLivroBibliaDB(raw)) {
    throw new Error(
      `Livro "${entry.slug}": JSON inválido — esperado { livro: string, capitulos: [...] }.`,
    );
  }

  const chapters: NormalizedChapter[] = raw.capitulos.map((cap) => ({
    chapter: cap.capitulo,
    verses: cap.versiculos.map((v) => ({
      verse: v.numero,
      text: v.texto,
    })),
  }));

  return {
    name: raw.livro,
    niceName: raw.livro,
    slug: entry.slug,
    order: index + 1,
    chapters,
  };
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
cd apps/api && bun test src/cli/modules/bible/bible-json-normalize.test.ts
```

Esperado: todos os testes passam.

- [ ] **Step 5: Verificar typecheck**

```bash
cd apps/api && bun typecheck
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/cli/modules/bible/bible-json-normalize.ts \
        apps/api/src/cli/modules/bible/bible-json-normalize.test.ts
git commit -m "feat(cli/bible): add normalizeLivroBibliaDB for biblia-db JSON format"
```

---

### Task 3: Criar `bible-fetcher.ts` com fetch paralelo e integrity check

**Files:**
- Create: `apps/api/src/cli/modules/bible/seed/bible-fetcher.ts`
- Test: `apps/api/src/cli/modules/bible/seed/bible-fetcher.test.ts` (criar)

**Interfaces:**
- Consumes:
  - `BIBLE_BOOKS`, `BASE_RAW_URL`, `EXPECTED_BOOK_COUNT` de `./bible-books.constants`
  - `normalizeLivroBibliaDB` de `../bible-json-normalize`
- Produces:
  ```ts
  export type FetchResult =
    | { ok: true; book: NormalizedBook; testament: "OLD" | "NEW" }
    | { ok: false; slug: string; reason: string }

  export async function fetchAllBibleBooks(): Promise<{
    books: Array<{ book: NormalizedBook; testament: "OLD" | "NEW" }>;
    errors: Array<{ slug: string; reason: string }>;
  }>

  export function integrityCheck(
    results: FetchResult[],
  ): { passed: boolean; errors: string[] }
  ```

- [ ] **Step 1: Escrever os testes**

Criar `apps/api/src/cli/modules/bible/seed/bible-fetcher.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { integrityCheck } from "./bible-fetcher";
import type { FetchResult } from "./bible-fetcher";
import { EXPECTED_BOOK_COUNT } from "./bible-books.constants";

const makeOkResult = (slug: string): FetchResult => ({
  ok: true,
  book: {
    name: slug,
    niceName: slug,
    slug,
    order: 1,
    chapters: [{ chapter: 1, verses: [{ verse: 1, text: "texto" }] }],
  },
  testament: "OLD",
});

const makeErrResult = (slug: string): FetchResult => ({
  ok: false,
  slug,
  reason: "HTTP 404",
});

describe("integrityCheck", () => {
  it("passes when all 73 results are ok", () => {
    const results: FetchResult[] = Array.from({ length: EXPECTED_BOOK_COUNT }, (_, i) =>
      makeOkResult(`slug${i}`),
    );
    const { passed, errors } = integrityCheck(results);
    expect(passed).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it("fails when any result is not ok", () => {
    const results: FetchResult[] = [
      ...Array.from({ length: EXPECTED_BOOK_COUNT - 1 }, (_, i) =>
        makeOkResult(`slug${i}`),
      ),
      makeErrResult("gn"),
    ];
    const { passed, errors } = integrityCheck(results);
    expect(passed).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("gn");
  });

  it("fails and lists all failed slugs when multiple errors", () => {
    const results: FetchResult[] = [
      makeOkResult("mt"),
      makeErrResult("gn"),
      makeErrResult("ex"),
    ];
    const { passed, errors } = integrityCheck(results);
    expect(passed).toBe(false);
    expect(errors).toHaveLength(2);
  });

  it("fails when total results < EXPECTED_BOOK_COUNT", () => {
    const results: FetchResult[] = [makeOkResult("gn")];
    const { passed, errors } = integrityCheck(results);
    expect(passed).toBe(false);
    expect(errors.some((e) => e.includes("73"))).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

```bash
cd apps/api && bun test src/cli/modules/bible/seed/bible-fetcher.test.ts
```

Esperado: FAIL — `integrityCheck is not a function`.

- [ ] **Step 3: Implementar `bible-fetcher.ts`**

Criar `apps/api/src/cli/modules/bible/seed/bible-fetcher.ts`:

```ts
import type { NormalizedBook } from "../bible-json-normalize";
import { normalizeLivroBibliaDB } from "../bible-json-normalize";
import {
  BASE_RAW_URL,
  BIBLE_BOOKS,
  EXPECTED_BOOK_COUNT,
} from "./bible-books.constants";
import type { BibleBookEntry } from "./bible-books.constants";

export type FetchResult =
  | { ok: true; book: NormalizedBook; testament: "OLD" | "NEW" }
  | { ok: false; slug: string; reason: string };

function bookUrl(entry: BibleBookEntry): string {
  const dir =
    entry.testament === "OLD" ? "antigotestamento" : "novotestamento";
  return `${BASE_RAW_URL}/${dir}/${entry.slug}.json`;
}

async function fetchBook(
  entry: BibleBookEntry,
  index: number,
): Promise<FetchResult> {
  const url = bookUrl(entry);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        ok: false,
        slug: entry.slug,
        reason: `HTTP ${res.status} em ${url}`,
      };
    }
    const raw: unknown = await res.json();
    const book = normalizeLivroBibliaDB(raw, entry, index);
    return { ok: true, book, testament: entry.testament };
  } catch (err) {
    return {
      ok: false,
      slug: entry.slug,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchAllBibleBooks(): Promise<{
  books: Array<{ book: NormalizedBook; testament: "OLD" | "NEW" }>;
  errors: Array<{ slug: string; reason: string }>;
}> {
  const results = await Promise.all(
    BIBLE_BOOKS.map((entry, index) => fetchBook(entry, index)),
  );

  const books: Array<{ book: NormalizedBook; testament: "OLD" | "NEW" }> = [];
  const errors: Array<{ slug: string; reason: string }> = [];

  for (const result of results) {
    if (result.ok) {
      books.push({ book: result.book, testament: result.testament });
    } else {
      errors.push({ slug: result.slug, reason: result.reason });
    }
  }

  return { books, errors };
}

export function integrityCheck(results: FetchResult[]): {
  passed: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const okCount = results.filter((r) => r.ok).length;
  if (results.length !== EXPECTED_BOOK_COUNT) {
    errors.push(
      `Total de resultados (${results.length}) diferente do esperado (${EXPECTED_BOOK_COUNT}).`,
    );
  }

  for (const result of results) {
    if (!result.ok) {
      errors.push(`[${result.slug}] ${result.reason}`);
    }
  }

  return { passed: errors.length === 0 && okCount === EXPECTED_BOOK_COUNT, errors };
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
cd apps/api && bun test src/cli/modules/bible/seed/bible-fetcher.test.ts
```

Esperado: todos passam.

- [ ] **Step 5: Verificar typecheck**

```bash
cd apps/api && bun typecheck
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/cli/modules/bible/seed/bible-fetcher.ts \
        apps/api/src/cli/modules/bible/seed/bible-fetcher.test.ts
git commit -m "feat(cli/bible): add bible fetcher with parallel fetch and integrity check"
```

---

### Task 4: Refatorar `seed.action.ts` para usar o fetcher (sem leitura de arquivo)

**Files:**
- Modify: `apps/api/src/cli/modules/bible/seed/seed.action.ts`

**Interfaces:**
- Consumes:
  - `fetchAllBibleBooks`, `integrityCheck` de `./bible-fetcher`
  - `NormalizedBook` de `../bible-json-normalize`
- Produces: `export async function seedBibleFromRemote(options: SeedBibleOptions): Promise<void>`
- Remove: `export async function seedBibleFromJson(jsonPath: string, options: SeedBibleOptions)`

- [ ] **Step 1: Substituir `seed.action.ts` inteiramente**

Reescrever `apps/api/src/cli/modules/bible/seed/seed.action.ts`:

```ts
import { logger } from "@versum/logger";
import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq } from "drizzle-orm";
import { env } from "@/utils/env/parser.ts";
import { db } from "../../../../infrastructure/db/index.ts";
import { bibleBooks } from "../../../../modules/bible/db/books.table.ts";
import { bibleChapters } from "../../../../modules/bible/db/chapters.table.ts";
import { bibleVerses } from "../../../../modules/bible/db/verses.table.ts";
import type { NormalizedBook } from "../bible-json-normalize.ts";
import { fetchAllBibleBooks, integrityCheck } from "./bible-fetcher.ts";
import { BIBLE_BOOKS } from "./bible-books.constants.ts";

type ExistingBook = InferSelectModel<typeof bibleBooks>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const WEBHOOK_URL = env.DISCORD_WEBHOOK_URL;

let messageId: string | null = null;
let logs: string[] = [];
let startTime: Date = new Date();
let endTime: Date | null = null;
let hasError = false;

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} - ${hours}h${minutes}`;
}

async function updateDiscordMessage() {
  const logsText = logs.join("\n");
  const truncatedLogs =
    logsText.length > 3800 ? `...\n${logsText.slice(-3800)}` : logsText;

  const embed = {
    title: `Logs do seed ${startTime.toISOString()}`,
    description: `**Logs:**\n\`\`\`\n${truncatedLogs}\n\`\`\``,
    fields: [
      { name: "Começou em:", value: formatDate(startTime), inline: true },
      {
        name: "Terminou em:",
        value: endTime ? formatDate(endTime) : "Em andamento",
        inline: true,
      },
      {
        name: "Houve erros?:",
        value: hasError ? "Sim" : "Não",
        inline: true,
      },
    ],
    color: hasError ? 0xe74c3c : endTime ? 0x2ecc71 : 0xffaa00,
    timestamp: new Date().toISOString(),
  };

  try {
    if (!messageId) {
      const response = await fetch(`${WEBHOOK_URL}?wait=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      });
      const data = (await response.json()) as { id: string };
      messageId = data.id;
    } else {
      await fetch(`${WEBHOOK_URL}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      });
    }
  } catch (err) {
    console.error("Erro ao atualizar Discord:", err);
  }
}

async function addLog(message: string) {
  logs.push(message);
  await updateDiscordMessage();
}

async function processBook(
  bookData: NormalizedBook,
  testament: "OLD" | "NEW",
  existingBooks: ExistingBook[],
  options: {
    insertBooks: boolean;
    insertChapters: boolean;
    insertVerses: boolean;
  },
  counters: {
    books: number;
    chapters: number;
    verses: number;
  },
) {
  const slug = bookData.slug || slugify(bookData.name);
  console.log(`📖 ${bookData.name} (${slug}) - ${testament}`);

  const existing = existingBooks.find(
    (b) => b.name === bookData.name || b.slug === slug,
  );

  if (options.insertBooks) {
    if (existing) {
      await addLog(`♻️ [${testament}] ${bookData.name} - já existe`);
    } else {
      const [newBook] = await db
        .insert(bibleBooks)
        .values({
          name: bookData.name,
          slug: slug,
          niceName: bookData.niceName || bookData.name,
          testament: testament,
          totalChapters: bookData.chapters.length,
          order: bookData.order,
        })
        .returning();

      if (newBook) existingBooks.push(newBook);
      counters.books++;

      await addLog(
        `📖 [${testament}] ${bookData.name} (${slug}) - ${bookData.chapters.length} caps`,
      );
    }
  }

  const book = existing || existingBooks.find((b) => b.name === bookData.name);

  if (!book) {
    await addLog(
      `❌ Livro não encontrado após tentativa de inserção: ${bookData.name}`,
    );
    return;
  }

  for (const chapterData of bookData.chapters) {
    const [existingChapter] = await db
      .select()
      .from(bibleChapters)
      .where(
        and(
          eq(bibleChapters.bookId, book.id),
          eq(bibleChapters.number, chapterData.chapter),
        ),
      );

    let chapter = existingChapter;

    if (options.insertChapters && !existingChapter) {
      const [newChapter] = await db
        .insert(bibleChapters)
        .values({
          bookId: book.id,
          number: chapterData.chapter,
          totalVerses: chapterData.verses.length,
        })
        .returning();

      chapter = newChapter;
      counters.chapters++;
    }

    if (!chapter) continue;

    if (options.insertVerses) {
      const chapterId = chapter.id;
      const [countResult] = await db
        .select({ total: count() })
        .from(bibleVerses)
        .where(eq(bibleVerses.chapterId, chapterId));

      const beforeCount = Number(countResult?.total ?? 0);

      const verses = chapterData.verses.map((vers) => ({
        chapterId,
        number: vers.verse,
        text: vers.text,
      }));

      if (verses.length > 0) {
        await db.insert(bibleVerses).values(verses).onConflictDoNothing();
      }

      const [afterCountResult] = await db
        .select({ total: count() })
        .from(bibleVerses)
        .where(eq(bibleVerses.chapterId, chapter.id));

      const afterCount = Number(afterCountResult?.total ?? 0);
      counters.verses += afterCount - beforeCount;
    }
  }
}

export interface SeedBibleOptions {
  insertBooks: boolean;
  insertChapters: boolean;
  insertVerses: boolean;
}

export async function seedBibleFromRemote(options: SeedBibleOptions) {
  startTime = new Date();
  logs = [];
  endTime = null;
  hasError = false;
  messageId = null;

  console.log("🔥 SEED INICIADO");
  await addLog("🔥 SEED INICIADO");

  try {
    console.log(`⬇️  Baixando ${BIBLE_BOOKS.length} livros do GitHub...`);
    await addLog(`⬇️  Baixando ${BIBLE_BOOKS.length} livros do GitHub...`);

    const { books, errors } = await fetchAllBibleBooks();

    const allResults = [
      ...books.map((b) => ({ ok: true as const, book: b.book, testament: b.testament })),
      ...errors.map((e) => ({ ok: false as const, slug: e.slug, reason: e.reason })),
    ];

    const { passed, errors: integrityErrors } = integrityCheck(allResults);

    if (!passed) {
      hasError = true;
      endTime = new Date();
      const errorMsg = `❌ INTEGRITY CHECK FALHOU:\n${integrityErrors.join("\n")}`;
      console.error(errorMsg);
      await addLog(errorMsg);
      logger("error", "Seed abortado: integrity check falhou.");
      return;
    }

    await addLog(`✅ Integrity OK — ${books.length} livros recebidos`);

    const existingBooks = await db.select().from(bibleBooks);

    const counters = { books: 0, chapters: 0, verses: 0 };

    await addLog("📜 Processando livros...");

    for (const { book, testament } of books) {
      await processBook(book, testament, existingBooks, options, counters);
    }

    endTime = new Date();

    await addLog("🎉 FINALIZADO!");
    await addLog(
      `📊 Livros: ${counters.books} | Capítulos: ${counters.chapters} | Versículos: ${counters.verses}`,
    );

    logger("success", "Seed da bíblia concluído!");
    console.log("✅ FINALIZADO");
  } catch (err: unknown) {
    hasError = true;
    endTime = new Date();

    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("💀 ERRO:", err);
    await addLog(`❌ ERRO: ${errorMessage}`);
    logger("error", `Erro no seed: ${errorMessage}`);
  }
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
cd apps/api && bun typecheck
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/cli/modules/bible/seed/seed.action.ts
git commit -m "feat(cli/bible): refactor seed to fetch from GitHub raw API with integrity check"
```

---

### Task 5: Simplificar menus e action da CLI (remover prompt de path de arquivo)

**Files:**
- Modify: `apps/api/src/cli/modules/bible/seed/seed.menus.ts`
- Modify: `apps/api/src/cli/modules/bible/bible.action.ts`
- Delete: `apps/api/src/cli/modules/bible/seed/helpers/find-cli-output-files.ts`

**Interfaces:**
- Consumes: `seedBibleFromRemote` de `./seed/seed.action`
- Remove: `seedBibleFromJson`, `seedBibleJsonPathPrompt`, `findCliOutputFiles`

- [ ] **Step 1: Remover `seedBibleJsonPathPrompt` de `seed.menus.ts`**

Substituir `apps/api/src/cli/modules/bible/seed/seed.menus.ts` por:

```ts
import prompts from "prompts";

export const confirmSeedPromptMenu = async () =>
  await prompts({
    type: "confirm",
    name: "confirm",
    message:
      "Deseja prosseguir com o seed da bíblia? Os dados serão buscados do repositório biblia-db.",
    initial: true,
  });

export const seedOptionsPromptMenu = async () =>
  await prompts({
    type: "multiselect",
    name: "options",
    message: "Selecione as opções de seed:",
    choices: [
      { title: "Inserir livros", value: "books", selected: true },
      { title: "Inserir capítulos", value: "chapters", selected: true },
      { title: "Inserir versículos", value: "verses", selected: true },
    ],
  });
```

- [ ] **Step 2: Atualizar `bible.action.ts` para remover o passo de path**

Substituir `apps/api/src/cli/modules/bible/bible.action.ts` por:

```ts
import { logger } from "@versum/logger";
import prompts from "prompts";
import { initCli } from "../../index";
import { type SeedBibleOptions, seedBibleFromRemote } from "./seed/seed.action";
import { confirmSeedPromptMenu, seedOptionsPromptMenu } from "./seed/seed.menus";

export const bibleMenu = async () =>
  await prompts({
    type: "select",
    name: "bible",
    message: "Escolha uma opção:",
    choices: [
      { title: "Seed (inserir no banco)", value: "seed" },
      { title: "Voltar", value: "back" },
    ],
  });

export async function bibleAction() {
  const menuResult = await bibleMenu();

  switch (menuResult.bible) {
    case "seed": {
      const { confirm } = await confirmSeedPromptMenu();

      if (!confirm) {
        logger("info", "Seed cancelado.");
        return await bibleAction();
      }

      const { options } = await seedOptionsPromptMenu();

      const seedOptions: SeedBibleOptions = {
        insertBooks: options.includes("books"),
        insertChapters: options.includes("chapters"),
        insertVerses: options.includes("verses"),
      };

      await seedBibleFromRemote(seedOptions);

      logger("info", "Pressione Enter para continuar...");
      await prompts({ type: "text", name: "continue", message: "" });

      return await bibleAction();
    }

    case "back":
      console.clear();
      logger(
        { color: "blue", icon: "", level: "info" },
        "Voltando para o menu...",
      );
      await initCli(false);
      return;
  }
}
```

- [ ] **Step 3: Deletar `find-cli-output-files.ts`**

```bash
rm apps/api/src/cli/modules/bible/seed/helpers/find-cli-output-files.ts
rmdir apps/api/src/cli/modules/bible/seed/helpers 2>/dev/null || true
```

- [ ] **Step 4: Verificar typecheck e lint**

```bash
cd apps/api && bun typecheck
```

Esperado: sem erros.

```bash
cd apps/api && bun lint
```

Esperado: sem novos erros.

- [ ] **Step 5: Rodar a suite de testes completa**

```bash
bun --filter '*' test
```

Esperado: todos os testes passam (190+ no api, 102+ no client).

- [ ] **Step 6: Commit final**

```bash
git add apps/api/src/cli/modules/bible/seed/seed.menus.ts \
        apps/api/src/cli/modules/bible/bible.action.ts
git rm apps/api/src/cli/modules/bible/seed/helpers/find-cli-output-files.ts
git commit -m "refactor(cli/bible): simplify CLI flow, fetch from GitHub raw API"
```

---

## Self-Review

### Spec coverage

| Requisito da spec | Task |
|---|---|
| Buscar JSONs do repositório biblia-db via raw API | Task 3, 4 |
| Lista canônica hardcoded dos 73 livros | Task 1 |
| Integrity check antes de seed | Task 3, 4 |
| Formato `{ livro, capitulos }` normalizado | Task 2 |
| Slug do arquivo = slug do DB | Task 2 (entry.slug) |
| niceName = campo `livro` | Task 2 |
| Testament derivado da constante | Task 1, 3 |
| Remover prompt de path de arquivo | Task 5 |
| Deletar `find-cli-output-files.ts` | Task 5 |
| Lógica `processBook` mantida intacta | Task 4 |
| Discord webhook mantido | Task 4 |

### Placeholder scan

Nenhum TBD, TODO, ou "similar ao task N" encontrado.

### Type consistency

- `NormalizedBook` — definido em `bible-json-normalize.ts`, consumido por `bible-fetcher.ts` e `seed.action.ts`
- `BibleBookEntry` — definido em `bible-books.constants.ts`, consumido por `bible-fetcher.ts` e `bible-json-normalize.ts`
- `SeedBibleOptions` — definido em `seed.action.ts`, exportado e consumido por `bible.action.ts`
- `FetchResult` — definido e exportado por `bible-fetcher.ts`, consumido internamente em `seed.action.ts`
- `seedBibleFromRemote` — definido em Task 4, consumido em Task 5 ✓
- `confirmSeedPromptMenu` — assinatura sem parâmetros em Task 5, consumida em Task 5 ✓
