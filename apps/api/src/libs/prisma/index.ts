export { prisma } from "./client";
export * from "../../../generated/prisma/client";

// Exportar tipos adicionais necessários do namespace Prisma
import { Prisma } from "../../../generated/prisma/client";

export type BibleBookFindManyArgs = Prisma.BibleBookFindManyArgs;
export type BibleBookCountArgs = Prisma.BibleBookCountArgs;
export type BibleBookUncheckedCreateInput =
  Prisma.BibleBookUncheckedCreateInput;

export type BibleChapterFindManyArgs = Prisma.BibleChapterFindManyArgs;
export type BibleChapterCountArgs = Prisma.BibleChapterCountArgs;
export type BibleChapterUncheckedCreateInput =
  Prisma.BibleChapterUncheckedCreateInput;

export type BibleVerseFindManyArgs = Prisma.BibleVerseFindManyArgs;
export type BibleVerseCountArgs = Prisma.BibleVerseCountArgs;
export type BibleVerseUncheckedCreateInput =
  Prisma.BibleVerseUncheckedCreateInput;

export type MagicLinkUncheckedCreateInput =
  Prisma.MagicLinkUncheckedCreateInput;
export type MagicLinkUncheckedUpdateInput =
  Prisma.MagicLinkUncheckedUpdateInput;

export type UserUncheckedCreateInput = Prisma.UserUncheckedCreateInput;
export type UserUncheckedUpdateInput = Prisma.UserUncheckedUpdateInput;

export type RefreshTokenUncheckedCreateInput =
  Prisma.RefreshTokenUncheckedCreateInput;
export type RefreshTokenUncheckedUpdateInput =
  Prisma.RefreshTokenUncheckedUpdateInput;
export type RefreshTokenScalarFieldEnum = Prisma.RefreshTokenScalarFieldEnum;
