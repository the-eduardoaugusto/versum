import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

// Placeholder pending verses endpoint confirmation
export const useVerses = cache(
  async (bookSlug: string, chapterNumber: number) => {
    "use cache";
    cacheLife("days");
    cacheTag(`bible:verses:${bookSlug}:${chapterNumber}`);

    console.log(`Fetching verses for ${bookSlug} chapter ${chapterNumber}`);
    // API call will go here
    return [];
  },
);
