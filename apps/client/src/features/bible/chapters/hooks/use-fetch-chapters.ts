// apps/client/src/features/bible/chapters/hooks/use-fetch-chapters.ts

import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

// TODO: Verify actual API endpoint structure after implementation
// This is a placeholder pending chapters endpoint confirmation
export const useChapters = cache(async (bookSlug: string) => {
  "use cache";
  cacheLife("max");
  cacheTag(`bible:chapters:${bookSlug}`);

  console.log(`Fetching chapters for book: ${bookSlug}`);
  // API call will go here
  return [];
});
