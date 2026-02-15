import { bibleBooks, bibleChapters } from "@/db/schema";
import {
  and,
  asc,
  count,
  eq,
  InferInsertModel,
  InferSelectModel,
} from "drizzle-orm";
import { db } from "@/db/client";

export type BibleChapter = InferSelectModel<typeof bibleChapters>;
export type NewBibleChapter = InferInsertModel<typeof bibleChapters>;

export class BibleChapterRepository {
  table = bibleChapters;
  db = db;

  async findByBookAndNumber({
    bookOrder,
    chapterNumber,
  }: {
    bookOrder: number;
    chapterNumber: number;
  }): Promise<BibleChapter | null> {
    const [book] = await this.db
      .select({ id: bibleBooks.id })
      .from(bibleBooks)
      .where(eq(bibleBooks.order, bookOrder))
      .limit(1);

    if (!book) return null;

    const [chapter] = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.bookId, book.id),
          eq(this.table.number, chapterNumber),
        ),
      );

    return chapter || null;
  }

  async findByBookId({ bookId }: { bookId: string }): Promise<BibleChapter[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.bookId, bookId))
      .orderBy(asc(this.table.number));
  }

  async findWithVerses({ chapterId }: { chapterId: string }) {
    return await this.db.query.bibleChapters.findFirst({
      where: eq(bibleChapters.id, chapterId),
      with: {
        verses: {
          orderBy: [asc(this.table.number)],
        },
      },
    });
  }

  findMany = this.db.select().from(this.table);
  count = this.db.select({ count: count(this.table.number) }).from(this.table);
}
