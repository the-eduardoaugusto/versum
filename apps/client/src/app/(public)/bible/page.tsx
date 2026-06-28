import type { Metadata } from "next";
import { getApiV1PublicBibleBooks } from "@/dal/orval/fetch/bíblia/bíblia";
import type { GetBooksResponse } from "@/dal/orval/tanstackQuery/schemas";

export const metadata: Metadata = {
  title: "Bíblia | Versum",
  description: "Sua bíblia pública online.",
};

async function fetchAllBibleBooks() {
  // "use cache";
  // cacheLife("max");
  // cacheTag("bible-page:fetchAllBibleBooks");

  console.log("Fetching all bible books...");
  const firstReq = await getApiV1PublicBibleBooks();
  let allBooks = firstReq.data ?? [];

  if (!firstReq.pagination?.hasNextPage) return allBooks;

  const promises: Promise<GetBooksResponse>[] = [];

  for (let pageInt = 2; pageInt <= firstReq.pagination.totalPages; pageInt++) {
    console.log(`Fetching page ${pageInt}...`);
    promises.push(getApiV1PublicBibleBooks({ page: pageInt.toString() }));
  }

  const results = await Promise.all(promises);
  allBooks = allBooks.concat(results.flatMap((r) => r.data ?? []));
  console.log(`All books fetched. Length: ${allBooks.length}`);

  return allBooks;
}

export default async function BiblePage() {
  // "use cache";

  // cacheLife("max");
  // cacheTag("bible-page");

  const bibleBooks = await fetchAllBibleBooks();

  // if (!bibleBooks) {
  //   revalidateTag("bible-page", "max")
  //   revalidateTag("bible-page:fetchAllBibleBooks", "max")
  //   return <div>An error occurred</div>
  // }

  return (
    <div className="w-screen h-svh flex flex-col items-center overflow-hidden">
      <h1 className="text-4xl">Bíblia Online</h1>
      <div>
        <ul>
          {bibleBooks.map((book) => (
            <li key={book.id}>{book.niceName}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
