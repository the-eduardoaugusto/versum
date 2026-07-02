import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NextChapterHint } from "./next-chapter-hint";

afterEach(cleanup);

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('[role="status"]');
}

describe("NextChapterHint", () => {
  it("tells desktop readers to scroll down by default", () => {
    const { container } = render(<NextChapterHint visible />);
    expect(getRoot(container)?.textContent).toContain(
      "Role para baixo para ir para o próximo capítulo",
    );
  });

  it("tells touch readers to drag", () => {
    const { container } = render(<NextChapterHint visible isTouch />);
    expect(getRoot(container)?.textContent).toContain(
      "Arraste para ir para o próximo capítulo",
    );
  });

  it("is shown and exposed to a11y when visible", () => {
    const { container } = render(<NextChapterHint visible />);
    const root = getRoot(container);
    expect(root?.getAttribute("aria-hidden")).toBe("false");
    expect(root?.className).toContain("opacity-100");
  });

  it("is hidden and removed from a11y tree when not visible", () => {
    const { container } = render(<NextChapterHint visible={false} />);
    const root = getRoot(container);
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    expect(root?.className).toContain("opacity-0");
  });

  it("animates the chevron by default", () => {
    const { container } = render(<NextChapterHint visible />);
    const icon = container.querySelector("svg");
    expect(icon?.getAttribute("class")).toContain("hint-bounce");
  });

  it("does not animate the chevron with reduced motion", () => {
    const { container } = render(<NextChapterHint visible reducedMotion />);
    const icon = container.querySelector("svg");
    expect(icon?.getAttribute("class") ?? "").not.toContain("hint-bounce");
  });
});
