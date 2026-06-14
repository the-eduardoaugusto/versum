import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChapterHeader } from "./chapter-header";

describe("ChapterHeader", () => {
  it("renders book name, chapter number and verse range", () => {
    const screen = render(
      <ChapterHeader
        bookName="Gênesis"
        chapterNumber={1}
        startVerse={1}
        endVerse={7}
        activePage={0}
        pageCount={3}
      />,
    );
    expect(screen.getByText(/Gênesis/)).toBeDefined();
    expect(screen.getByText(/1/)).toBeDefined();
    expect(screen.getByText(/1-7/)).toBeDefined();
  });

  it("does not render dots when pageCount <= 1", () => {
    const screen = render(
      <ChapterHeader
        bookName="Gênesis"
        chapterNumber={1}
        startVerse={1}
        endVerse={3}
        activePage={0}
        pageCount={1}
      />,
    );
    const dots = screen.container.querySelectorAll("[data-active]");
    expect(dots).toHaveLength(0);
  });

  it("renders dots when pageCount > 1", () => {
    const screen = render(
      <ChapterHeader
        bookName="Gênesis"
        chapterNumber={1}
        startVerse={1}
        endVerse={7}
        activePage={1}
        pageCount={3}
      />,
    );
    const dots = screen.container.querySelectorAll("[data-active]");
    expect(dots).toHaveLength(3);
  });
});
