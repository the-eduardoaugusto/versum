import { relations } from "drizzle-orm";
import { bibleChapters } from "./chapters/bible-chapters.schema";
import { bibleBooks } from "./bible-books.schema";

export const bibleBooksRelations = relations(bibleBooks, ({ many }) => ({
  chapters: many(bibleChapters),
}));
