import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedChapter } from "../types";
import { useActiveChapter } from "./use-active-chapter";

function createWrapper() {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

function createMockChapter(id: string): FeedChapter {
  return {
    id,
    bookName: "Gênesis",
    bookSlug: "genesis",
    chapterNumber: Number(id.replace("ch", "")),
    totalVerses: 31,
    verses: [],
  };
}

describe("useActiveChapter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns activeChapterId as null initially", () => {
    const container = document.createElement("div");
    const ref = { current: container };
    const chapters = [createMockChapter("ch1")];

    const { result } = renderHook(
      () =>
        useActiveChapter(ref, {
          chapters,
          isAtEnd: false,
          fetchNextPage: vi.fn(),
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.activeChapterId).toBeNull();
  });

  it("calls fetchNextPage when active chapter is near end of list", () => {
    const container = document.createElement("div");
    const ch1 = document.createElement("div");
    ch1.setAttribute("data-chapter-id", "ch1");
    const ch2 = document.createElement("div");
    ch2.setAttribute("data-chapter-id", "ch2");
    container.appendChild(ch1);
    container.appendChild(ch2);

    const ref = { current: container };
    const chapters = [createMockChapter("ch1"), createMockChapter("ch2")];
    const fetchNextPage = vi.fn();

    renderHook(
      () =>
        useActiveChapter(ref, {
          chapters,
          isAtEnd: false,
          fetchNextPage,
        }),
      { wrapper: createWrapper() },
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("does not call fetchNextPage when buffer is sufficient", () => {
    const container = document.createElement("div");
    ["ch1", "ch2", "ch3", "ch4", "ch5"].forEach((id) => {
      const el = document.createElement("div");
      el.setAttribute("data-chapter-id", id);
      container.appendChild(el);
    });

    const ref = { current: container };
    const chapters = ["ch1", "ch2", "ch3", "ch4", "ch5"].map(createMockChapter);
    const fetchNextPage = vi.fn();

    renderHook(
      () =>
        useActiveChapter(ref, {
          chapters,
          isAtEnd: false,
          fetchNextPage,
        }),
      { wrapper: createWrapper() },
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
