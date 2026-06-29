"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Suggestion } from "../types";
import { parseReference } from "../utils/bible-reference-parser";
import { matchBooks } from "../utils/book-matcher";
import { generateChapterSuggestions } from "../utils/chapter-suggestions";
import { generateVerseSuggestions } from "../utils/verse-suggestions";
import { useBooksQuery } from "./use-books-query";
import { useChapterQuery } from "./use-chapter-query";

export function useBibleSearch() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [justCompleted, setJustCompleted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { books } = useBooksQuery();

  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const parsedInput = useMemo(() => {
    if (!books.length) return { stage: "idle" as const };
    return parseReference(inputValue, books);
  }, [inputValue, books]);

  const chapterQueryEnabled = parsedInput.stage === "verse";
  const chapterSlug =
    parsedInput.stage === "verse" ? parsedInput.book.slug : "";
  const chapterNumber =
    parsedInput.stage === "verse" ? parsedInput.chapterNumber : 0;

  const { chapter, isLoading: isLoadingVerses } = useChapterQuery(
    chapterSlug,
    chapterNumber,
    chapterQueryEnabled,
  );

  const suggestions = useMemo((): Suggestion[] => {
    if (justCompleted || parsedInput.stage === "idle") return [];

    if (parsedInput.stage === "book") {
      return matchBooks(parsedInput.partial, books).map((book) => ({
        type: "book" as const,
        book,
        label: book.niceName,
        value: `${book.niceName} `,
      }));
    }

    if (parsedInput.stage === "chapter") {
      return generateChapterSuggestions(
        parsedInput.book.totalChapters,
        parsedInput.chapterPartial,
      ).map((n) => ({
        type: "chapter" as const,
        number: n,
        label: `${parsedInput.book.niceName} ${n}`,
        value: `${parsedInput.book.niceName} ${n}:`,
      }));
    }

    if (parsedInput.stage === "verse" && chapter?.totalVerses) {
      return generateVerseSuggestions(
        chapter.totalVerses,
        parsedInput.versePartial,
      ).map((n) => ({
        type: "verse" as const,
        number: n,
        label: `${parsedInput.book.niceName} ${parsedInput.chapterNumber}:${n}`,
        value: `${parsedInput.book.niceName} ${parsedInput.chapterNumber}:${n}`,
      }));
    }

    return [];
  }, [parsedInput, books, chapter, justCompleted]);

  const completeWith = useCallback((suggestion: Suggestion) => {
    setInputValue(suggestion.value);
    setJustCompleted(true);
    setActiveSuggestion(-1);
  }, []);

  const onInputChange = useCallback((value: string) => {
    setInputValue(value);
    setJustCompleted(false);
    setActiveSuggestion(-1);
  }, []);

  const onSubmit = useCallback(() => {
    if (!books.length) return;

    if (parsedInput.stage === "verse") {
      const verse = parsedInput.versePartial
        ? parseInt(parsedInput.versePartial, 10)
        : null;
      if (verse && verse > 0) {
        router.push(
          `/bible/books/${parsedInput.book.slug}/chapters/${parsedInput.chapterNumber}/verses/${verse}`,
        );
        return;
      }
      router.push(
        `/bible/books/${parsedInput.book.slug}/chapters/${parsedInput.chapterNumber}`,
      );
      return;
    }

    if (parsedInput.stage === "chapter") {
      const n = parseInt(parsedInput.chapterPartial, 10);
      if (n > 0 && n <= parsedInput.book.totalChapters) {
        router.push(`/bible/books/${parsedInput.book.slug}/chapters/${n}`);
        return;
      }
      router.push(`/bible/books/${parsedInput.book.slug}`);
      return;
    }

    if (parsedInput.stage === "book") {
      const matches = matchBooks(parsedInput.partial, books);
      if (matches.length > 0) {
        router.push(`/bible/books/${matches[0].slug}`);
      }
    }
  }, [parsedInput, books, router]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const hasSuggestions = suggestions.length > 0;

      if (e.key === "Escape") {
        setActiveSuggestion(-1);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          Math.min(prev + 1, suggestions.length - 1),
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((prev) => Math.max(prev - 1, -1));
        return;
      }

      if (e.key === "Tab" && !isMobile && hasSuggestions) {
        e.preventDefault();
        completeWith(suggestions[activeSuggestion >= 0 ? activeSuggestion : 0]);
        return;
      }

      if (e.key === "Enter") {
        if (isMobile && hasSuggestions) {
          e.preventDefault();
          completeWith(
            suggestions[activeSuggestion >= 0 ? activeSuggestion : 0],
          );
          return;
        }
        e.preventDefault();
        onSubmit();
      }
    },
    [suggestions, activeSuggestion, isMobile, completeWith, onSubmit],
  );

  const matchedPart = useMemo(() => {
    if (parsedInput.stage === "book") return parsedInput.partial;
    if (parsedInput.stage === "chapter") return parsedInput.chapterPartial;
    if (parsedInput.stage === "verse") return parsedInput.versePartial;
    return "";
  }, [parsedInput]);

  const onHoverSuggestion = useCallback((index: number) => {
    setActiveSuggestion(index);
  }, []);

  return {
    inputValue,
    onInputChange,
    suggestions,
    activeSuggestion,
    matchedPart,
    onKeyDown,
    onSubmit,
    stage: parsedInput.stage,
    isLoadingVerses: isLoadingVerses && chapterQueryEnabled,
    completeWith,
    onHoverSuggestion,
    isMobile,
  };
}
