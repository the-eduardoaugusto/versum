import { count, eq, sql } from "drizzle-orm";
import { db as drizzle } from "../../../../infrastructure/db/index.ts";
import {
  bibleBooks,
  bibleChapters,
  bibleVerses,
  discoveryReadings,
} from "../../../../infrastructure/db/schema.ts";

export class DiscoveryRepositoryV1 {
  private readonly db: typeof drizzle;

  constructor({ db }: { db?: typeof drizzle } = {}) {
    this.db = db ?? drizzle;
  }

  async getRandomVersesForChapter(
    chapterId: string,
  ): Promise<(typeof bibleVerses.$inferSelect)[]> {
    const verses = await this.db
      .select()
      .from(bibleVerses)
      .where(eq(bibleVerses.chapterId, chapterId))
      .orderBy(bibleVerses.number);

    return verses;
  }

  async findChapterById(chapterId: string) {
    const [result] = await this.db
      .select({
        chapter: bibleChapters,
        book: bibleBooks,
      })
      .from(bibleChapters)
      .innerJoin(bibleBooks, eq(bibleChapters.bookId, bibleBooks.id))
      .where(eq(bibleChapters.id, chapterId));

    return result ?? null;
  }

  async getVersesByIds(verseIds: string[]) {
    return this.db
      .select()
      .from(bibleVerses)
      .innerJoin(bibleChapters, eq(bibleVerses.chapterId, bibleChapters.id))
      .innerJoin(bibleBooks, eq(bibleChapters.bookId, bibleBooks.id))
      .where(
        sql`${bibleVerses.id} IN (${sql.join(
          verseIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );
  }

  async insertReadVerses(
    userId: string,
    verseIds: string[],
  ): Promise<void> {
    if (verseIds.length === 0) return;

    const values = verseIds.map((verseId) => ({
      userId,
      verseId,
    }));

    await this.db.insert(discoveryReadings).values(values);
  }

  async getReadVersesCount(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(discoveryReadings)
      .where(eq(discoveryReadings.userId, userId));

    return result?.count ?? 0;
  }
}
