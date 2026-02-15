import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    token: varchar("token", { length: 500 }).notNull().unique(),
    expiresAt: timestamp("expires_at", {
      precision: 3,
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", {
      precision: 3,
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  },
  (table) => [
    index("refresh_tokens_user_id_idx").on(table.userId),
    index("refresh_tokens_token_idx").on(table.token),
    index("refresh_tokens_expires_at_idx").on(table.expiresAt),
    index("refresh_tokens_ip_address_idx").on(table.ipAddress),
  ],
);
