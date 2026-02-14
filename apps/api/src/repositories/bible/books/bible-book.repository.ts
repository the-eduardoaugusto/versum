import { db } from "@/db/client";
import { bibleBooks, bibleChapters } from "@/db/schema";
import {
  asc,
  count,
  eq,
  InferInsertModel,
  InferSelectModel,
} from "drizzle-orm";

export type BibleBook = InferSelectModel<typeof bibleBooks>;
export type NewBibleBook = InferInsertModel<typeof bibleBooks>;

export class BibleBookRepository {
  table = bibleBooks;
  db = db;

  async findByName({
    bookName,
  }: {
    bookName: string;
  }): Promise<BibleBook | null> {
    const [book] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.name, bookName));
    return book || null;
  }

  async findByOrder({
    bookOrder,
  }: {
    bookOrder: number;
  }): Promise<BibleBook | null> {
    const [book] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.order, bookOrder));
    return book || null;
  }

  async findByTestament({
    testament,
  }: {
    testament: any;
  }): Promise<BibleBook[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.testament, testament));
  }

  async findWithChapters({ bookId }: { bookId: string }) {
    return await this.db.query.bibleBooks.findFirst({
      where: eq(bibleBooks.id, bookId),
      with: {
        chapters: {
          orderBy: [asc(bibleChapters.number)],
        },
      },
    });
  }

  async findAllOrderedByOrder(): Promise<BibleBook[]> {
    return await this.db
      .select()
      .from(this.table)
      .orderBy(asc(this.table.order));
  }

  async findById({ bookId }: { bookId: string }): Promise<BibleBook | null> {
    const book = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, bookId))
      .limit(1);
    return book[0] || null;
  }

  findMany = this.db.select().from(this.table);
  get count() {
    return this.db.select({ count: count(this.table.order) }).from(this.table);
  }
}
