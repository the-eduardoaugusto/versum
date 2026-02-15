import { readings } from "@/db/schemas/users/readings/readings.schema";
import { bibleChapters } from "../bible-chapters.schema";
import { bibleVerses } from "./bible-verses.schema";
import { likes } from "@/db/schemas/users/likes/likes.schema";
import { marks } from "@/db/schemas/users/marks/marks.schema";
import { relations } from "drizzle-orm";

export const bibleVersesRelations = relations(bibleVerses, ({ one, many }) => ({
  chapter: one(bibleChapters, {
    fields: [bibleVerses.chapterId],
    references: [bibleChapters.id],
  }),
  readings: many(readings),
  likes: many(likes),
  marks: many(marks),
}));
