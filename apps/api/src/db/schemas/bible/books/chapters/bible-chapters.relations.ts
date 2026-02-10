import { relations } from "drizzle-orm";
import { bibleBooks } from "../bible-books.schema";
import { bibleChapters } from "./bible-chapters.schema";
import { bibleVerses } from "./verses/bible-verses.schema";

export const bibleChaptersRelations = relations(
  bibleChapters,
  ({ one, many }) => ({
    book: one(bibleBooks, {
      fields: [bibleChapters.bookId],
      references: [bibleBooks.id],
    }),
    verses: many(bibleVerses),
  }),
);
