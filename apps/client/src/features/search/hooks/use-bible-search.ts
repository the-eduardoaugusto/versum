"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Suggestion } from "../types";
import { parseReference } from "../utils/bible-reference-parser";
import { matchBooks } from "../utils/book-matcher";
import { generateChapterSuggestions } from "../utils/chapter-suggestions";
import { useBooksQuery } from "./use-books-query";

const debug =
  process.env.NODE_ENV !== "production"
    ? (...args: unknown[]) => console.debug("[bible-search:hook]", ...args)
    : () => {};

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
    if (!books.length) {
      debug(
        "books ainda não carregados (books.length === 0) -> stage idle. inputValue:",
        JSON.stringify(inputValue),
      );
      return { stage: "idle" as const };
    }
    const parsed = parseReference(inputValue, books);
    debug("inputValue:", JSON.stringify(inputValue), "-> parsedInput:", parsed);
    return parsed;
  }, [inputValue, books]);

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
        value: `${parsedInput.book.niceName} ${n}`,
      }));
    }

    return [];
  }, [parsedInput, books, justCompleted]);

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
    debug(
      "onSubmit chamado. stage:",
      parsedInput.stage,
      "books.length:",
      books.length,
    );

    if (!books.length) {
      debug("onSubmit no-op: books ainda não carregados");
      return;
    }

    if (parsedInput.stage === "chapter") {
      const n = parseInt(parsedInput.chapterPartial, 10);
      if (n > 0 && n <= parsedInput.book.totalChapters) {
        const url = `/bible/books/${parsedInput.book.slug}/chapters/${n}`;
        debug("stage chapter válido -> router.push:", url);
        router.push(url);
        return;
      }
      const url = `/bible/books/${parsedInput.book.slug}/chapters/`;
      debug(
        "stage chapter com número inválido (n:",
        n,
        "totalChapters:",
        parsedInput.book.totalChapters,
        ") -> router.push:",
        url,
      );
      router.push(url);
      return;
    }

    if (parsedInput.stage === "book") {
      const matches = matchBooks(parsedInput.partial, books);
      if (matches.length > 0) {
        const url = `/bible/books/${matches[0].slug}/chapters/`;
        debug(
          "stage book resolvido. partial:",
          JSON.stringify(parsedInput.partial),
          "matches:",
          matches.map((b) => b.slug),
          "-> router.push:",
          url,
        );
        router.push(url);
      } else {
        debug(
          "NO-OP: stage book sem nenhum match para partial:",
          JSON.stringify(parsedInput.partial),
          "-> nenhuma navegação ocorre",
        );
      }
      return;
    }

    debug(
      "onSubmit no-op: stage não é book nem chapter. stage:",
      parsedInput.stage,
    );
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
          debug(
            "Enter no mobile com sugestões -> completeWith (não chama onSubmit)",
          );
          e.preventDefault();
          completeWith(
            suggestions[activeSuggestion >= 0 ? activeSuggestion : 0],
          );
          return;
        }
        debug(
          "Enter -> onSubmit direto. isMobile:",
          isMobile,
          "hasSuggestions:",
          hasSuggestions,
        );
        e.preventDefault();
        onSubmit();
      }
    },
    [suggestions, activeSuggestion, isMobile, completeWith, onSubmit],
  );

  const matchedPart = useMemo(() => {
    if (parsedInput.stage === "book") return parsedInput.partial;
    if (parsedInput.stage === "chapter") return parsedInput.chapterPartial;
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
    completeWith,
    onHoverSuggestion,
    isMobile,
  };
}
