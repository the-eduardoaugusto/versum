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
    .replace(/[\u0300-\u036f]/g, "")
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
