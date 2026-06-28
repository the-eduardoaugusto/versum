import type { Book } from "@/dal/orval/zod/schemas";

export type SearchStage = "idle" | "book" | "chapter" | "verse";

export type ParsedInput =
  | { stage: "idle" }
  | { stage: "book"; partial: string }
  | { stage: "chapter"; book: Book; chapterPartial: string }
  | { stage: "verse"; book: Book; chapterNumber: number; versePartial: string };

export type BookSuggestion = {
  type: "book";
  book: Book;
  label: string;
  value: string;
};

export type ChapterSuggestion = {
  type: "chapter";
  number: number;
  label: string;
  value: string;
};

export type VerseSuggestion = {
  type: "verse";
  number: number;
  label: string;
  value: string;
};

export type Suggestion = BookSuggestion | ChapterSuggestion | VerseSuggestion;
