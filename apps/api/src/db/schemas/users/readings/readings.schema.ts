import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "../users.schema";
import { bibleVerses } from "../../bible/books/chapters/verses/bible-verses.schema";
import { readingModeEnum } from "./readings.enum";

export const readings = pgTable(
  "readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    verseId: uuid("verse_id")
      .notNull()
      .references(() => bibleVerses.id, {
        onDelete: "cascade",
      }),
    mode: readingModeEnum("mode").notNull(),
    readAt: timestamp("read_at", {
      withTimezone: true,
      precision: 3,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("readings_user_id_read_at_idx").on(table.userId, table.readAt.desc()),
    index("readings_verse_id_idx").on(table.verseId),
  ],
);
