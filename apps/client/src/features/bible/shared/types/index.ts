// apps/client/src/features/bible/shared/types/index.ts

import type { Book, Chapter, Verse } from "@/dal/orval/fetch/schemas";

export type BibleHierarchyItem = {
  id: string;
  niceName: string;
  slug?: string;
};

export type { Book, Chapter, Verse };
