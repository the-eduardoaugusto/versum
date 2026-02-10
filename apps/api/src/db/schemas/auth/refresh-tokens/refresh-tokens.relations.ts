import { relations } from "drizzle-orm";
import { refreshTokens } from "./refresh-tokens.schema";
import { users } from "../../users/users.schema";

export const refreshTokensRelation = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));
