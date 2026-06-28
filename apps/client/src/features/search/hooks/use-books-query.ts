import { useGetApiV1PublicBibleBooks } from "@/dal/orval/tanstackQuery/bíblia/bíblia";
import type { Book } from "@/dal/orval/zod/schemas";

export function useBooksQuery(): { books: Book[]; isLoading: boolean } {
  const { data, isLoading } = useGetApiV1PublicBibleBooks(
    { limit: "100", page: "1" },
    { query: { staleTime: Infinity } },
  );

  const books: Book[] = data?.status === 200 ? (data.data.data ?? []) : [];

  return { books, isLoading };
}
