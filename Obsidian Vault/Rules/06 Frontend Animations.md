---
title: "06 Frontend Animations"
section: Rules
tags: [versum, rules]
up: "[[Rules/_Index|Rules]]"
prev: "[[05 Tooling]]"
next: "[[LGPD Compliance]]"
---

🏠 [[_Index|Home]] › 📐 [[Rules/_Index|Rules]] › **06 Frontend Animations**

---

# Frontend Animations (GSAP + SSR)

## Why this matters

Because we use Next.js, every page is server-side rendered (SSR) by default. The
server sends fully rendered HTML that the browser paints **before** JavaScript
hydrates and GSAP runs.

If an element has a GSAP entrance animation but no initial hidden state, the user
sees the final content for a brief moment (rendered by SSR), and then the
animation plays from the start. This "flash" looks like a rendering bug and is
exactly what we want to avoid.

## The Rule

When an element is animated in on mount with GSAP, it must start hidden in the
server-rendered HTML.

- **Wrap the animated content in `className="invisible"`** (Tailwind
  `visibility: hidden`). This is the project convention because it:
  - is part of the SSR output, so the content is hidden on first paint;
  - reserves layout space (no layout shift when it appears);
  - does not collide with GSAP animating `opacity` + `clearProps` (they control
    different properties — `visibility` vs `opacity`).
- **Inside `useGSAP`**, apply the initial GSAP state (`gsap.set` / `gsap.from`),
  then **reveal** the element by removing the `invisible` class. GSAP animates
  `opacity` (and transforms) to the visible state.
- Do **not** rely solely on `gsap.set({ opacity: 0 })` in the effect without an
  SSR hidden state — effects run after the first paint, so the flash still
  occurs.

## Implementation Notes

- Use `useGSAP` / `gsap.context()` so animations are properly scoped and cleaned
  up on unmount.
- **Reveal in every branch of the effect.** If you early-return (e.g. for
  reduced motion), you must still remove `invisible`, otherwise the content stays
  hidden forever.
- **If a parent conditionally swaps the animated subtree** (e.g. an edit-mode
  toggle that re-renders the wrapper with `invisible` again), include that flag
  in the `useGSAP` dependencies so the reveal runs again.
- Respect accessibility: when `prefers-reduced-motion: reduce` is set, skip the
  animation but still reveal the element (`opacity: 1`, no `invisible`) so
  content is never permanently hidden.

## Example

```tsx
// `invisible` = visibility:hidden in the SSR HTML — no flash.
<div ref={containerRef} className="invisible flex flex-col">
  <h1 className="profile-header">Welcome</h1>
</div>;

useGSAP(
  () => {
    const reveal = () => containerRef.current?.classList.remove("invisible");

    if (prefersReducedMotion) {
      reveal(); // still reveal on the early-return branch
      return;
    }

    gsap.from(".profile-header", {
      y: 16,
      opacity: 0,
      duration: 0.4,
      clearProps: "transform,opacity",
    });

    reveal(); // reveal after the initial hidden state is applied
  },
  { scope: containerRef, dependencies: [prefersReducedMotion] },
);
```


---

◀ [[05 Tooling]] · 📐 [[Rules/_Index|Rules]] · [[LGPD Compliance]] ▶
