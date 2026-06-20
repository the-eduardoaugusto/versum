import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "../../users/db/users.table";

export const consentLogs = pgTable(
  "consent_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: varchar("purpose", { length: 100 }).notNull(),
    granted: boolean("granted").notNull(),
    ip: text("ip"),
    createdAt: timestamp("created_at", {
      precision: 3,
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("consent_logs_user_id").on(table.userId)],
);
