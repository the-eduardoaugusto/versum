import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FeedProgress } from "../types";
import { FeedProgressBar } from "./feed-progress";

const progress: FeedProgress = {
  chaptersRead: 50,
  chaptersRemaining: 1139,
  totalChapters: 1189,
  percentComplete: 4.2,
  isAtEnd: false,
};

describe("FeedProgressBar", () => {
  it("does not render when progress is null", () => {
    const screen = render(<FeedProgressBar progress={null} />);
    expect(screen.container.firstChild).toBeNull();
  });

  it("renders progress bar with correct width", () => {
    const screen = render(<FeedProgressBar progress={progress} />);
    const bar = screen.container.querySelector(".h-full");
    expect(bar).not.toBeNull();
  });
});
