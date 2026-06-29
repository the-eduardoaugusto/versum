import type { Book } from "@/dal/orval/fetch/schemas";
import { BibleItemLink } from "../../shared/components/bible-item-link";

interface TestamentProps {
  title: string;
  books: Book[];
}

export function Testament({ title, books }: TestamentProps) {
  return (
    <section className="bg-accent-foreground/5 rounded-lg border border-accent/20 p-6">
      <h2 className="text-2xl md:text-3xl font-instrument-serif mb-4">
        {title}
      </h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {books.map((book) => (
          <li
            key={book.id}
            className="rounded-lg px-2 py-1 hover:bg-accent/10 transition-colors"
          >
            <BibleItemLink
              item={book}
              href={`/bible/books/${book.slug}/chapters`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
