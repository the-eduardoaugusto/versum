import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import { getApiV1PublicBibleBooksDynamicIdChaptersNumberVerses } from "@/dal/orval/fetch/bíblia/bíblia";
import type { Verse } from "@/dal/orval/fetch/schemas";

export const useVerses = cache(
  async (bookSlug: string, chapterNumber: number): Promise<Verse[]> => {
    "use cache";
    cacheLife("days");
    cacheTag(`bible:verses:${bookSlug}:${chapterNumber}`);

    const chapterStr = chapterNumber.toString();
    const firstReq =
      await getApiV1PublicBibleBooksDynamicIdChaptersNumberVerses(
        bookSlug,
        chapterStr,
      );
    let allVerses = firstReq.data ?? [];

    if (!firstReq.pagination?.hasNextPage) {
      return allVerses;
    }

    const promises = [];
    for (
      let pageInt = 2;
      pageInt <= firstReq.pagination.totalPages;
      pageInt++
    ) {
      promises.push(
        getApiV1PublicBibleBooksDynamicIdChaptersNumberVerses(
          bookSlug,
          chapterStr,
          { page: pageInt },
        ),
      );
    }

    const results = await Promise.all(promises);
    allVerses = allVerses.concat(results.flatMap((r) => r.data ?? []));

    return allVerses;
  },
);
