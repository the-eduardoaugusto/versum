# Bible Feature Refactor & BibleItemLink Animation

**Date:** 2026-06-28  
**Status:** Design Review  
**Scope:** Refactor `/apps/client/src/app/(public)/bible/books/page.tsx` to feature pattern, add BibleItemLink with hover animation, prepare modular hierarchy for chapters and verses.

---

## Goals

1. Move bible page logic from app route into modular `features/bible/` structure
2. Create reusable `BibleItemLink` component with GSAP Power3 hover animation
3. Establish clean separation between books/chapters/verses sub-features
4. Enable future expansion to chapters and verses pages with consistent patterns

---

## Architecture

### Folder Structure

```
features/bible/
├── shared/
│   ├── components/
│   │   └── bible-item-link.tsx           (reusable, animated link)
│   └── types/
│       └── index.ts                      (shared types)
├── books/
│   ├── components/
│   │   └── testament.tsx                 (old Testament component)
│   ├── hooks/
│   │   └── use-fetch-books.ts            (fetches paginated books)
│   └── utils/
├── chapters/
│   ├── components/
│   ├── hooks/
│   │   └── use-fetch-chapters.ts         (fetches chapters for book)
│   └── utils/
└── verses/
    ├── components/
    ├── hooks/
    │   └── use-fetch-verses.ts           (fetches verses for chapter)
    └── utils/

app/(public)/bible/
├── books/
│   └── page.tsx                          (imports & composes books feature)
├── books/[slug]/
│   ├── layout.tsx
│   └── chapters/
│       ├── page.tsx                      (imports & composes chapters feature)
│       └── [chapterNumber]/
│           └── page.tsx                  (imports & composes verses feature)
└── layout.tsx
```

### Data Flow

**Books Page** → fetches books via `use-fetch-books` → renders Testament layout → maps Books to `BibleItemLink` with href to chapters.

**Chapters Page** → fetches chapters via `use-fetch-chapters` → renders list of chapters → maps Chapters to `BibleItemLink` with href to verses.

---

## Components

### BibleItemLink

**Purpose:** Generic, reusable link component for any item in the hierarchy (Book, Chapter). Animates arrow icon on hover.

**Props:**
```typescript
interface BibleItemLinkProps {
  item: { id: string; niceName: string; slug: string };
  href: string;
}
```

**Behavior:**
- Renders: `niceName` + arrow icon (right side)
- On hover:
  1. Arrow slides out right and fades
  2. New arrow appears from left, pushes text slightly right
  3. Uses GSAP `.to()` with `power3.easeOut` timing
- On hover exit: Animates back to original state

**Implementation notes:**
- Use GSAP timeline or individual tweens for smooth orchestration
- Arrow elements: one visible + one positioned off-screen (left)
- Text wrapper should accommodate slight rightward shift during animation
- Keyboard accessible: work on focus as well as hover

### Testament

**Purpose:** Layout component for grouping books by testament (New/Old).

**Props:**
```typescript
interface TestamentProps {
  title: string;
  books: Book[];
}
```

**No changes** — moves to `features/bible/books/components/` as-is.

---

## Hooks

### useBooks

**Purpose:** Fetch all books with pagination, cached for ISR.

**Location:** `features/bible/books/hooks/use-fetch-books.ts`

**Implementation:** Extract current `fetchAllBibleBooks()` async function into a hook that:
- Use React `cache()` wrapper to deduplicate requests in same render pass
- Use `"use cache"` directive with `cacheLife("max")` for long cache duration
- Tag with `cacheTag("bible:books")` for targeted revalidation
- Returns `{ newTestament: Book[], oldTestament: Book[] }`
- Handles pagination automatically

```typescript
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";

export const useBooks = cache(async () => {
  "use cache";
  cacheLife("max");
  cacheTag("bible:books");
  
  // pagination logic...
  return { newTestament, oldTestament };
});
```

### useChapters

**Purpose:** Fetch chapters for a given book, cached per-book with ISR.

**Location:** `features/bible/chapters/hooks/use-fetch-chapters.ts`

**Implementation pattern:**
```typescript
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";

export const useChapters = cache(async (bookSlug: string) => {
  "use cache";
  cacheLife("max");
  cacheTag(`bible:chapters:${bookSlug}`);
  
  const chapters = await getApiV1PublicBibleBooks({ bookSlug }, { path: "/chapters" });
  return chapters;
});
```

### useVerses

**Purpose:** Fetch verses for a given chapter, cached per-chapter with ISR.

**Location:** `features/bible/verses/hooks/use-fetch-verses.ts`

**Implementation pattern:**
```typescript
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";

export const useVerses = cache(async (bookSlug: string, chapterNumber: number) => {
  "use cache";
  cacheLife("days"); // verses may update more frequently
  cacheTag(`bible:verses:${bookSlug}:${chapterNumber}`);
  
  const verses = await getApiV1PublicBibleBooks({ bookSlug, chapterNumber }, { path: "/verses" });
  return verses;
});
```

---

## Types

**Location:** `features/bible/shared/types/index.ts`

Export or define:
- Extended Book type with slug, testament
- Chapter type (when API schema available)
- Verse type (when API schema available)
- Generic hierarchy types if needed

---

## File Naming Convention

All `.tsx` and `.ts` files use **kebab-case**: `bible-item-link.tsx`, `use-fetch-books.ts`, `testament.tsx`

Exported functions/components remain PascalCase inside files: `export function BibleItemLink()`, `export function useBooks()`.

---

## Pages

### books/page.tsx

- Import `useBooks` hook
- Fetch and split books by testament
- Render Testament components
- Each book renders as `BibleItemLink` pointing to `/bible/books/{slug}/chapters`

### books/[slug]/chapters/page.tsx

- Accept `params.slug`
- Import `useChapters` hook
- Fetch chapters for book
- Render list of chapters as `BibleItemLink` pointing to `/bible/books/{slug}/chapters/{chapterNumber}`
- Show book title/header

### books/[slug]/chapters/[chapterNumber]/page.tsx

- Accept `params.slug` and `params.chapterNumber`
- Import `useVerses` hook
- Fetch verses for chapter
- Render list of verses (can reuse `BibleItemLink` or create `VerseItemLink` variant)
- Show book title and chapter number/header

---

## Animation Details

**BibleItemLink Hover Animation (GSAP Power3.easeOut):**

**Timeline:**
1. **0ms:** User hovers on `<BibleItemLink>`
2. **0-300ms:** Current arrow (right) slides out right, opacity fades to 0
3. **0-300ms:** New arrow (initially at `x: -20px`, opacity 0) animates to final position, opacity to 1
4. **Text:** Stays mostly static, or slight 2-4px rightward shift if desired for visual impact
5. **On exit:** Reverse animation back to rest state

**GSAP Implementation:**
```javascript
// Pseudo-code
gsap.to(currentArrow, {
  x: 20,
  opacity: 0,
  duration: 0.3,
  ease: "power3.easeOut"
});
gsap.to(newArrow, {
  x: 0,
  opacity: 1,
  duration: 0.3,
  ease: "power3.easeOut"
}, "<"); // start at same time
```

---

## Caching Strategy

Use Next.js Data Cache + React `cache()` function for ISR (Incremental Static Regeneration) on-demand:

**Fetch hooks pattern:**
- Wrap fetch calls with React `cache()` to deduplicate requests during render
- Use `"use cache"` directive and `cacheLife()` to set max cache duration
- Tag caches: `cacheTag("bible:books")`, `cacheTag("bible:chapters:{slug}")`, `cacheTag("bible:verses:{slug}:{chapter}")`
- Only regenerate when: data changes on backend or cache expires

**Per-level caching:**
- **Books:** `cacheLife("max")` — books list rarely changes, can stay cached longest
- **Chapters:** `cacheLife("max")` with specific book slug tag — per-book isolation
- **Verses:** `cacheLife("days")` or less frequent — content may update more often

**Benefit:** Avoid redundant API calls within same request, re-generate pages on-demand as visitors hit them (not on schedule).

---

## Testing Strategy

- **Unit:** Components receive correct props, render structure
- **Integration:** Hooks fetch and return data in expected shape
- **Visual:** Manual verification of animation smoothness and timing
- **Accessibility:** BibleItemLink works with keyboard nav, screen readers
- **Cache:** Verify cache tags are applied, deduplication works, stale data isn't served

---

## Future Considerations

- Verses page: follows same pattern as chapters
- Breadcrumbs or navigation trail (books → chapters → verses)
- Search feature integration (already exists in `/features/search`)
- Caching strategy consistency across all hierarchy levels

---

## Rollout Plan

1. Create `features/bible/` structure with empty sub-features
2. Implement `BibleItemLink` with animation
3. Implement `useBooks` hook, move Testament component
4. Update `books/page.tsx` to import from feature
5. Delete old route files and consolidate
6. Test books page end-to-end
7. Leave chapter/verse hooks as placeholders for future work
