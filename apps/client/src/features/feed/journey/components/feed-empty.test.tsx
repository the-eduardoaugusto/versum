import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeedEmpty } from "./feed-empty";

describe("FeedEmpty", () => {
  it("renders completion message", () => {
    const screen = render(<FeedEmpty />);
    expect(screen.getByText("Você completou a Bíblia!")).toBeDefined();
    expect(
      screen.getByText("Parabéns por concluir a leitura de toda a Bíblia."),
    ).toBeDefined();
  });
});
