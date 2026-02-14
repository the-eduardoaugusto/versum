import { db } from "@/db/client";
import { magicLinks } from "@/db/schema";
import { NotFoundError, UnauthorizedError } from "@/utils/error-model";
import * as argon2 from "argon2";
import {
  and,
  eq,
  gt,
  InferInsertModel,
  InferSelectModel,
  isNull,
} from "drizzle-orm";

export type MagicLink = InferSelectModel<typeof magicLinks>;
export type NewMagicLink = InferInsertModel<typeof magicLinks>;

export class MagicLinkRepository {
  table = magicLinks;
  db = db;

  async findMagicLinkByTokenAndEmail({
    email,
    token,
  }: {
    email: string;
    token: string;
  }) {
    const [magicLink] = await this.db
      .select()
      .from(this.table)
      .where(
        and(eq(this.table.email, email), gt(this.table.expiresAt, new Date())),
      );

    if (!magicLink) throw new NotFoundError("Magic link not found!");

    if (await argon2.verify(magicLink.token, token))
      throw new UnauthorizedError("Invalid token!");
    return magicLink;
  }

  async findByPublicId({ publicId }: { publicId: string }) {
    const [magicLink] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.publicId, publicId));

    if (!magicLink) throw new NotFoundError("Magic link not found!");

    return magicLink;
  }

  async updateMagicLink({
    id,
    data,
  }: {
    id: string;
    data: Partial<MagicLink>;
  }) {
    const [magicLink] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id));

    if (!magicLink) throw new NotFoundError("Magic link not found!");

    return await this.db
      .update(this.table)
      .set(data)
      .where(
        and(
          eq(this.table.id, id),
          isNull(this.table.usedAt),
          isNull(this.table.invalidatedAt),
          gt(this.table.expiresAt, new Date()),
        ),
      );
  }

  async createMagicLink({ email, token }: { token: string; email: string }) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const encryptedToken = await argon2.hash(token);

    const [magicLink] = await this.db
      .insert(this.table)
      .values({
        token: encryptedToken,
        email,
        expiresAt,
      })
      .returning();

    return magicLink || null;
  }
}
