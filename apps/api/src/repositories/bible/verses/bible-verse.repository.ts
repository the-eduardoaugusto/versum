import { bibleVerses } from "@/db/schema";
import {
  and,
  asc,
  count,
  eq,
  InferInsertModel,
  InferSelectModel,
} from "drizzle-orm";
import { db } from "@/db/client";

export type BibleVerse = InferSelectModel<typeof bibleVerses>;
export type NewBibleVerse = InferInsertModel<typeof bibleVerses>;

export class BibleVerseRepository {
  table = bibleVerses;
  db = db;

  async findByChapterAndNumber({
    chapterId,
    verseNumber,
  }: {
    chapterId: string;
    verseNumber: number;
  }): Promise<BibleVerse | null> {
    const [verse] = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.chapterId, chapterId),
          eq(this.table.number, verseNumber),
        ),
      );

    return verse || null;
  }

  async findByChapterId({
    chapterId,
  }: {
    chapterId: string;
  }): Promise<BibleVerse[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.chapterId, chapterId))
      .orderBy(asc(this.table.number));
  }

  async findWithRelations({ verseId }: { verseId: string }) {
    return await this.db.query.bibleVerses.findFirst({
      where: eq(bibleVerses.id, verseId),
      with: {
        likes: true,
        marks: true,
        readings: true,
      },
    });
  }

  findMany = this.db.select().from(this.table);
  count = this.db.select({ count: count(this.table.number) }).from(this.table);
}
