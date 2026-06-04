import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { VersePage } from "../types";
import { VersesPage } from "./verses-page";

const page: VersePage = {
  startVerse: 1,
  endVerse: 3,
  verses: [
    { id: "v1", number: 1, text: "In the beginning" },
    { id: "v2", number: 2, text: "And the earth" },
    { id: "v3", number: 3, text: "And God said" },
  ],
};

describe("VersesPage", () => {
  it("renders all verses with numbers", () => {
    const screen = render(<VersesPage page={page} />);
    expect(screen.getByText("In the beginning")).toBeDefined();
    expect(screen.getByText("And the earth")).toBeDefined();
    expect(screen.getByText("And God said")).toBeDefined();
  });
});
