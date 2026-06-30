import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Book, Chapter } from "@/dal/orval/zod/schemas";
import { useBibleSearch } from "../hooks/use-bible-search";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

vi.mock("@/dal/orval/tanstackQuery/bíblia/bíblia", () => ({
  useGetApiV1PublicBibleBooks: vi.fn(),
  useGetApiV1PublicBibleBooksDynamicIdChaptersNumber: vi.fn(),
}));

import {
  useGetApiV1PublicBibleBooks,
  useGetApiV1PublicBibleBooksDynamicIdChaptersNumber,
} from "@/dal/orval/tanstackQuery/bíblia/bíblia";

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: "1",
  order: 1,
  name: "genesis",
  slug: "gn",
  niceName: "Gênesis",
  testament: "OLD",
  totalChapters: 50,
  ...overrides,
});

const makeChapter = (overrides: Partial<Chapter> = {}): Chapter => ({
  id: "c1",
  bookId: "1",
  number: 1,
  totalVerses: 31,
  ...overrides,
});

const BOOKS: Book[] = [
  makeBook(),
  makeBook({
    id: "2",
    order: 66,
    slug: "ap",
    name: "apocalipse",
    niceName: "Apocalipse",
    totalChapters: 22,
  }),
];

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("useBibleSearch", () => {
  beforeEach(() => {
    vi.mocked(useGetApiV1PublicBibleBooks).mockReturnValue({
      data: {
        status: 200,
        data: { data: BOOKS, success: true },
        headers: new Headers(),
      },
      isLoading: false,
    } as ReturnType<typeof useGetApiV1PublicBibleBooks>);

    vi.mocked(
      useGetApiV1PublicBibleBooksDynamicIdChaptersNumber,
    ).mockReturnValue({
      data: {
        status: 200,
        data: { data: makeChapter(), success: true },
        headers: new Headers(),
      },
      isLoading: false,
    } as ReturnType<typeof useGetApiV1PublicBibleBooksDynamicIdChaptersNumber>);

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts with empty state", () => {
    const { result } = renderHook(() => useBibleSearch(), { wrapper });
    expect(result.current.inputValue).toBe("");
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.stage).toBe("idle");
  });

  it("shows book suggestions when typing a book partial", () => {
    const { result } = renderHook(() => useBibleSearch(), { wrapper });

    act(() => result.current.onInputChange("Gên"));

    expect(result.current.stage).toBe("book");
    expect(result.current.suggestions.length).toBeGreaterThan(0);
    expect(result.current.suggestions[0].label).toBe("Gênesis");
  });

  it("shows chapter suggestions when book is resolved", () => {
    const { result } = renderHook(() => useBibleSearch(), { wrapper });

    act(() => result.current.onInputChange("Gênesis 1"));

    expect(result.current.stage).toBe("chapter");
    expect(result.current.suggestions.length).toBeGreaterThan(0);
    expect(result.current.suggestions.some((s) => s.label.includes("1"))).toBe(
      true,
    );
  });

  it("shows verse suggestions when colon is present", () => {
    const { result } = renderHook(() => useBibleSearch(), { wrapper });

    act(() => result.current.onInputChange("Gênesis 1:"));

    expect(result.current.stage).toBe("verse");
    expect(result.current.suggestions.length).toBeGreaterThan(0);
  });

  it("completeWith fills input and blocks suggestions", () => {
    const { result } = renderHook(() => useBibleSearch(), { wrapper });

    act(() => result.current.onInputChange("Gên"));
    const suggestion = result.current.suggestions[0];

    act(() => result.current.completeWith(suggestion));

    expect(result.current.inputValue).toBe(suggestion.value);
    expect(result.current.suggestions).toEqual([]);
  });

  it("suggestions reappear after manual keystroke post-completion", () => {
    const { result } = renderHook(() => useBibleSearch(), { wrapper });

    act(() => result.current.onInputChange("Gên"));
    act(() => result.current.completeWith(result.current.suggestions[0]));

    act(() => result.current.onInputChange("Gênesis 1"));

    expect(result.current.suggestions.length).toBeGreaterThan(0);
  });

  it("Tab completes suggestion on desktop", () => {
    const { result } = renderHook(() => useBibleSearch(), { wrapper });

    act(() => result.current.onInputChange("Gên"));
    const firstSuggestion = result.current.suggestions[0];

    act(() =>
      result.current.onKeyDown({
        key: "Tab",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>),
    );

    expect(result.current.inputValue).toBe(firstSuggestion.value);
  });

  it("navigates to book on submit with only book", () => {
    const { result } = renderHook(() => useBibleSearch(), { wrapper });

    act(() => result.current.onInputChange("Gn"));
    act(() => result.current.onSubmit());

    expect(mockPush).toHaveBeenCalledWith("/bible/books/gn/chapters/");
  });

  it("navigates to chapter on submit with book + chapter", () => {
    const { result } = renderHook(() => useBibleSearch(), { wrapper });

    act(() => result.current.onInputChange("Gênesis 1"));
    act(() => result.current.onSubmit());

    expect(mockPush).toHaveBeenCalledWith("/bible/books/gn/chapters/1");
  });

  it("navigates to verse on submit with full reference", () => {
    const { result } = renderHook(() => useBibleSearch(), { wrapper });

    act(() => result.current.onInputChange("Gênesis 1:10"));
    act(() => result.current.onSubmit());

    expect(mockPush).toHaveBeenCalledWith("/bible/books/gn/chapters/1");
  });

  it("Escape clears active suggestion without closing list", () => {
    const { result } = renderHook(() => useBibleSearch(), { wrapper });

    act(() => result.current.onInputChange("Gên"));
    act(() =>
      result.current.onKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>),
    );
    expect(result.current.activeSuggestion).toBe(0);

    act(() =>
      result.current.onKeyDown({
        key: "Escape",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>),
    );
    expect(result.current.activeSuggestion).toBe(-1);
  });
});
