import { relations } from "drizzle-orm";
import { bibleVerses } from "../../bible";
import { users } from "../users.schema";
import { marks } from "./marks.schema";

export const marksRelations = relations(marks, ({ one }) => ({
  user: one(users, {
    fields: [marks.userId],
    references: [users.id],
  }),
  verse: one(bibleVerses, {
    fields: [marks.verseId],
    references: [bibleVerses.id],
  }),
}));
