import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageDots } from "./page-dots";

describe("PageDots", () => {
  it("renders correct number of dots", () => {
    const screen = render(<PageDots activePage={0} pageCount={5} />);
    const dots = screen.container.querySelectorAll("span");
    expect(dots).toHaveLength(5);
  });

  it("marks active dot with data-active=true", () => {
    const screen = render(<PageDots activePage={2} pageCount={5} />);
    const dots = screen.container.querySelectorAll("span");
    expect(dots[2].getAttribute("data-active")).toBe("true");
    expect(dots[0].getAttribute("data-active")).toBe("false");
  });

  it("handles pageCount of 1", () => {
    const screen = render(<PageDots activePage={0} pageCount={1} />);
    const dots = screen.container.querySelectorAll("span");
    expect(dots).toHaveLength(1);
    expect(dots[0].getAttribute("data-active")).toBe("true");
  });
});
