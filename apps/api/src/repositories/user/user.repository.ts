import { users } from "@/db/schema";
import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "@/db/client";

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export class UserRepository {
  table = users;
  db = db;

  async findByEmail({ email }: { email: string }) {
    const [user] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.email, email));

    return user || null;
  }

  async findByUsername({ username }: { username: string }) {
    const [user] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.username, username));

    return user || null;
  }

  async create({
    email,
    name,
    username,
    createdAt,
  }: {
    email: string;
    name: string;
    username: string;
    createdAt: Date;
  }) {
    const [user] = await this.db
      .insert(this.table)
      .values({
        email,
        name,
        username,
        createdAt,
      })
      .returning();

    return user || null;
  }
}
