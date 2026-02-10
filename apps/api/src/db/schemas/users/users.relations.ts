import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { refreshTokens } from "../auth/refresh-tokens/refresh-tokens.schema";
import { readings } from "./readings/readings.schema";
import { likes } from "./likes/likes.schema";
import { marks } from "./marks/marks.schema";

export const userRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  readings: many(readings),
  likes: many(likes),
  marks: many(marks),
}));
