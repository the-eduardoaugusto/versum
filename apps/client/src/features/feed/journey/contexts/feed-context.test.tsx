import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeedProvider, useFeed } from "./feed-context";

vi.mock("../hooks/use-journey-feed", () => ({
  useJourneyFeed: () => ({
    chapters: [],
    progress: null,
    isLoading: false,
    isError: false,
    error: null,
    hasNextPage: true,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
  }),
}));

vi.mock("../hooks/use-journey-progress", () => ({
  useJourneyProgress: () => ({
    markAsRead: vi.fn(),
    isMarking: false,
    status: null,
  }),
}));

vi.mock("../hooks/use-active-chapter", () => ({
  useActiveChapter: () => ({
    activeChapterId: null,
  }),
}));

function TestComponent() {
  const value = useFeed();
  return (
    <div>
      <span data-testid="chapters-length">{value.chapters.length}</span>
      <span data-testid="is-loading">{String(value.isLoading)}</span>
      <span data-testid="is-error">{String(value.isError)}</span>
      <span data-testid="has-next-page">{String(value.hasNextPage)}</span>
    </div>
  );
}

describe("FeedContext", () => {
  it("provides default values through useFeed", () => {
    render(
      <FeedProvider>
        <TestComponent />
      </FeedProvider>,
    );

    expect(screen.getByTestId("chapters-length").textContent).toBe("0");
    expect(screen.getByTestId("is-loading").textContent).toBe("false");
    expect(screen.getByTestId("is-error").textContent).toBe("false");
    expect(screen.getByTestId("has-next-page").textContent).toBe("true");
  });

  it("throws when useFeed is used outside provider", () => {
    expect(() => render(<TestComponent />)).toThrow(
      "useFeed must be used within FeedProvider",
    );
  });
});
