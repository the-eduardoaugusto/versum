import type { Book } from "@/dal/orval/zod/schemas";
import type { ParsedInput } from "../types";
import { matchBooks } from "./book-matcher";

// Groups: [1] bookPart, [2] chapterPart, [3] versePart
// Handles: "Gênesis", "Gn 1", "Gênesis 1:", "1 João 3:5", "1Jo 3:5"
// Book part allows ".()" because several niceNames use them: "S. João", "Job (Jó)".
const REF_REGEX =
  /^((?:\d+\s*)?[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.()]*?)(?:\s+(\d+)(?::(\d*))?)?$/;

const debug =
  process.env.NODE_ENV !== "production"
    ? (...args: unknown[]) => console.debug("[bible-search:parser]", ...args)
    : () => {};

export function parseReference(input: string, books: Book[]): ParsedInput {
  const trimmed = input.trim();
  if (!trimmed) {
    debug("input vazio -> stage idle");
    return { stage: "idle" };
  }

  const match = trimmed.match(REF_REGEX);
  if (!match) {
    debug(
      "REF_REGEX não bateu com input:",
      JSON.stringify(trimmed),
      "-> stage idle",
    );
    return { stage: "idle" };
  }

  const bookToken = match[1].trim();
  const chapterPart = match[2];

  debug(
    "regex ok. bookToken:",
    JSON.stringify(bookToken),
    "chapterPart:",
    chapterPart ?? null,
  );

  if (!chapterPart) {
    debug("sem chapterPart -> stage book, partial:", JSON.stringify(bookToken));
    return { stage: "book", partial: bookToken };
  }

  const [resolvedBook] = matchBooks(bookToken, books);
  if (!resolvedBook) {
    debug(
      "chapterPart presente mas matchBooks não resolveu bookToken -> stage book (fallback), partial:",
      JSON.stringify(bookToken),
    );
    return { stage: "book", partial: bookToken };
  }

  debug(
    "stage chapter. book:",
    resolvedBook.slug,
    "chapterPartial:",
    chapterPart,
  );

  return {
    stage: "chapter",
    book: resolvedBook,
    chapterPartial: chapterPart,
  };
}
