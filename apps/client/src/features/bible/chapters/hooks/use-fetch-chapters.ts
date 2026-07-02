// apps/client/src/features/bible/chapters/hooks/use-fetch-chapters.ts

import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import { getApiV1PublicBibleBooksDynamicIdChapters } from "@/dal/orval/fetch/bíblia/bíblia";
import type { Chapter } from "@/dal/orval/fetch/schemas";

export const useChapters = cache(
  async (bookSlug: string): Promise<Chapter[]> => {
    "use cache";
    cacheLife("max");
    cacheTag(`bible:chapters:${bookSlug}`);

    const firstReq = await getApiV1PublicBibleBooksDynamicIdChapters(bookSlug);
    let allChapters = firstReq.data ?? [];

    if (!firstReq.pagination?.hasNextPage) {
      return allChapters;
    }

    const promises = [];
    for (
      let pageInt = 2;
      pageInt <= firstReq.pagination.totalPages;
      pageInt++
    ) {
      promises.push(
        getApiV1PublicBibleBooksDynamicIdChapters(bookSlug, {
          page: pageInt,
        }),
      );
    }

    const results = await Promise.all(promises);
    allChapters = allChapters.concat(results.flatMap((r) => r.data ?? []));

    return allChapters;
  },
);
