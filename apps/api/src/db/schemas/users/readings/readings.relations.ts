import { bibleVerses } from "../../bible";
import { users } from "../users.schema";
import { readings } from "./readings.schema";
import { relations } from "drizzle-orm";

export const readingsRelations = relations(readings, ({ one }) => ({
  user: one(users, {
    fields: [readings.userId],
    references: [users.id],
  }),
  verse: one(bibleVerses, {
    fields: [readings.verseId],
    references: [bibleVerses.id],
  }),
}));
