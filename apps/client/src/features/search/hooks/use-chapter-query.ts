import { useGetApiV1PublicBibleBooksDynamicIdChaptersNumber } from "@/dal/orval/tanstackQuery/bíblia/bíblia";
import type { Chapter } from "@/dal/orval/zod/schemas";

const FIVE_MINUTES = 5 * 60 * 1000;

export function useChapterQuery(
  slug: string,
  chapterNumber: number,
  enabled: boolean,
): { chapter: Chapter | undefined; isLoading: boolean } {
  const { data, isLoading } =
    useGetApiV1PublicBibleBooksDynamicIdChaptersNumber(
      slug,
      String(chapterNumber),
      {
        query: {
          enabled: enabled && !!slug && chapterNumber > 0,
          staleTime: FIVE_MINUTES,
        },
      },
    );

  const chapter: Chapter | undefined =
    data?.status === 200 ? data.data.data : undefined;

  return { chapter, isLoading };
}
