import type { Book } from "@/dal/orval/zod/schemas";
import type { ParsedInput } from "../types";
import { matchBooks } from "./book-matcher";

// Groups: [1] bookPart, [2] chapterPart, [3] versePart
// Handles: "Gênesis", "Gn 1", "Gênesis 1:", "1 João 3:5", "1Jo 3:5"
const REF_REGEX =
  /^((?:\d+\s*)?[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?)(?:\s+(\d+)(?::(\d*))?)?$/;

export function parseReference(input: string, books: Book[]): ParsedInput {
  const trimmed = input.trim();
  if (!trimmed) return { stage: "idle" };

  const match = trimmed.match(REF_REGEX);
  if (!match) return { stage: "idle" };

  const bookToken = match[1].trim();
  const chapterPart = match[2];
  const versePart = match[3];

  if (!chapterPart) {
    return { stage: "book", partial: bookToken };
  }

  const [resolvedBook] = matchBooks(bookToken, books);
  if (!resolvedBook) {
    return { stage: "book", partial: bookToken };
  }

  if (versePart === undefined) {
    return {
      stage: "chapter",
      book: resolvedBook,
      chapterPartial: chapterPart,
    };
  }

  return {
    stage: "verse",
    book: resolvedBook,
    chapterNumber: parseInt(chapterPart, 10),
    versePartial: versePart,
  };
}
