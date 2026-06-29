import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import { getApiV1PublicBibleBooks } from "@/dal/orval/fetch/bíblia/bíblia";
import type { GetBooksResponse } from "@/dal/orval/fetch/schemas";
import { BookTestament } from "@/dal/orval/zod/schemas";

export const useBooks = cache(async () => {
  "use cache";
  cacheLife("max");
  cacheTag("bible:books");

  console.log("Fetching all bible books...");
  const firstReq = await getApiV1PublicBibleBooks();
  let allBooks = firstReq.data ?? [];

  if (!firstReq.pagination?.hasNextPage) {
    return {
      allBooks,
      newTestament: [],
      oldTestament: [],
    };
  }

  const promises: Promise<GetBooksResponse>[] = [];

  for (let pageInt = 2; pageInt <= firstReq.pagination.totalPages; pageInt++) {
    console.log(`Fetching page ${pageInt}...`);
    promises.push(getApiV1PublicBibleBooks({ page: pageInt.toString() }));
  }

  const results = await Promise.all(promises);
  allBooks = allBooks.concat(results.flatMap((r) => r.data ?? []));
  console.log(`All books fetched. Length: ${allBooks.length}`);

  const newTestament = allBooks.filter(
    (book) => book.testament === BookTestament.NEW,
  );
  const oldTestament = allBooks.filter(
    (book) => book.testament === BookTestament.OLD,
  );

  return { allBooks, newTestament, oldTestament };
});
