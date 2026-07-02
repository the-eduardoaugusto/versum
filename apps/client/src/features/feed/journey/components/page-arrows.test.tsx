import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageArrows } from "./page-arrows";

afterEach(cleanup);

function getButtons(container: HTMLElement) {
  const prev = container.querySelector<HTMLButtonElement>(
    '[aria-label="Página anterior"]',
  );
  const next = container.querySelector<HTMLButtonElement>(
    '[aria-label="Próxima página"]',
  );
  return { prev, next };
}

describe("PageArrows", () => {
  it("renders prev and next buttons", () => {
    const { container } = render(
      <PageArrows
        visible
        canPrev
        canNext
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    const { prev, next } = getButtons(container);
    expect(prev).not.toBeNull();
    expect(next).not.toBeNull();
  });

  it("disables prev when canPrev is false", () => {
    const { container } = render(
      <PageArrows
        visible
        canPrev={false}
        canNext
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    const { prev, next } = getButtons(container);
    expect(prev?.disabled).toBe(true);
    expect(next?.disabled).toBe(false);
  });

  it("disables next when canNext is false", () => {
    const { container } = render(
      <PageArrows
        visible
        canPrev
        canNext={false}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    const { prev, next } = getButtons(container);
    expect(next?.disabled).toBe(true);
    expect(prev?.disabled).toBe(false);
  });

  it("disables both buttons when not visible", () => {
    const { container } = render(
      <PageArrows
        visible={false}
        canPrev
        canNext
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    const { prev, next } = getButtons(container);
    expect(prev?.disabled).toBe(true);
    expect(next?.disabled).toBe(true);
  });

  it("fires onPrev and onNext on click", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { container } = render(
      <PageArrows visible canPrev canNext onPrev={onPrev} onNext={onNext} />,
    );
    const { prev, next } = getButtons(container);
    if (!prev || !next) throw new Error("buttons not found");
    fireEvent.click(prev);
    fireEvent.click(next);
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
