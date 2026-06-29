import type { Book } from "@/dal/orval/fetch/schemas";
import { BibleItemLink } from "../../shared/components/bible-item-link";

interface TestamentProps {
  title: string;
  books: Book[];
}

export function Testament({ title, books }: TestamentProps) {
  return (
    <section className="bg-accent-foreground/5 rounded-4xl border-l-2 border-accent p-6 max-h-full">
      <h2 className="text-4xl font-instrument-serif">{title}</h2>
      <ul className="md:columns-2 py-2">
        {books.map((book) => (
          <li key={book.id} className="break-inside-avoid py-1">
            <BibleItemLink item={book} href={`/bible/books/${book.slug}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}
