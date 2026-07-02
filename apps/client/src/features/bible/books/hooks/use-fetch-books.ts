"use server";

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

  if (firstReq.pagination?.hasNextPage) {
    const promises: Promise<GetBooksResponse>[] = [];

    for (let page = 2; page <= firstReq.pagination.totalPages; page++) {
      console.log(`Fetching page ${page}...`);
      promises.push(getApiV1PublicBibleBooks({ page }));
    }

    const results = await Promise.all(promises);
    allBooks = allBooks.concat(results.flatMap((r) => r.data ?? []));
  }

  console.log(`All books fetched. Length: ${allBooks.length}`);

  const newTestament = allBooks.filter(
    (book) => book.testament === BookTestament.NEW,
  );
  const oldTestament = allBooks.filter(
    (book) => book.testament === BookTestament.OLD,
  );

  return { allBooks, newTestament, oldTestament };
});
