import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChapterSkeleton } from "./chapter-skeleton";

describe("ChapterSkeleton", () => {
  it("renders default count of 1", () => {
    const screen = render(<ChapterSkeleton />);
    const items = screen.container.querySelectorAll(".animate-pulse");
    expect(items).toHaveLength(1);
  });

  it("renders N skeletons", () => {
    const screen = render(<ChapterSkeleton count={3} />);
    const items = screen.container.querySelectorAll(".animate-pulse");
    expect(items).toHaveLength(3);
  });
});
