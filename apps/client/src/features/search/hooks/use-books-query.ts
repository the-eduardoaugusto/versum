import { useQuery } from "@tanstack/react-query";
import type { Book } from "@/dal/orval/zod/schemas";
import { useBooks } from "@/features/bible/books/hooks/use-fetch-books";

const fetchBooks = async () => {
  const books = await useBooks();
  return books;
};

export function useBooksQuery(): { books: Book[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["bible-books"],
    queryFn: fetchBooks,
  });

  const books = data?.allBooks ?? [];

  return { books, isLoading };
}
