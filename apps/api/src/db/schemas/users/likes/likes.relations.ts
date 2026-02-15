import { relations } from "drizzle-orm";
import { bibleVerses } from "../../bible";
import { users } from "../users.schema";
import { likes } from "./likes.schema";

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  verse: one(bibleVerses, {
    fields: [likes.verseId],
    references: [bibleVerses.id],
  }),
}));
