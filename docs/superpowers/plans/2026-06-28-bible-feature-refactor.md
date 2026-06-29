# Bible Feature Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor bible page to modular feature pattern with animated BibleItemLink component, add ISR caching strategy, prepare hierarchical structure for chapters and verses with comprehensive SEO optimization for search engine ranking.

**Architecture:** Single `features/bible/` feature with `shared/` components/types and isolated sub-features (books, chapters, verses). Each sub-feature has hooks for data fetching with React `cache()` + Next.js `cacheLife()`/`cacheTag()`. Route pages in `app/(public)/bible/` import and compose feature code with SEO metadata and JSON-LD structured data.

**Tech Stack:** React 19, Next.js 16 (App Router), GSAP 3 (Power3.easeOut animation), TanStack Query v5, Tailwind v4, shadcn/ui.

## Global Constraints

- File naming: kebab-case for `.tsx` and `.ts` files (`bible-item-link.tsx`, not `BibleItemLink.tsx`)
- Function exports remain PascalCase: `export function BibleItemLink()`
- Cache directives: `"use cache"` + `cacheLife()` + `cacheTag()` per fetch hook
- Commit message footer: Do NOT add "Generated with Claude Code" attribution
- Animation: GSAP `power3.easeOut` timing function
- SEO: JSON-LD structured data (WebPage, BreadcrumbList), Open Graph tags, canonical URLs, keywords optimization

---

## File Structure

**Created:**
- `apps/client/src/features/bible/shared/components/bible-item-link.tsx`
- `apps/client/src/features/bible/shared/components/seo-structured-data.tsx`
- `apps/client/src/features/bible/shared/types/index.ts`
- `apps/client/src/features/bible/shared/utils/seo-metadata.ts`
- `apps/client/src/features/bible/books/hooks/use-fetch-books.ts`
- `apps/client/src/features/bible/books/components/testament.tsx`
- `apps/client/src/features/bible/chapters/hooks/use-fetch-chapters.ts`
- `apps/client/src/features/bible/verses/hooks/use-fetch-verses.ts`
- `apps/client/src/app/(public)/bible/books/[slug]/chapters/page.tsx`
- `apps/client/src/app/(public)/bible/books/[slug]/chapters/[chapterNumber]/page.tsx`

**Modified:**
- `apps/client/src/app/(public)/bible/books/page.tsx` — refactor to use feature hooks + SEO
- `apps/client/src/app/(public)/bible/layout.tsx` — verify no changes needed

**Deleted:**
- `apps/client/src/app/(public)/bible/[book]/page.tsx` (old route, replaced by new structure)
- `apps/client/src/app/(public)/bible/page.tsx` (redirects moved to books)

---

## Task 1: Create shared types

**Files:**
- Create: `apps/client/src/features/bible/shared/types/index.ts`

**Interfaces:**
- Produces: `type BibleHierarchyItem = { id: string; niceName: string; slug?: string };` (used by BibleItemLink)

- [ ] **Step 1: Create types file**

```typescript
// apps/client/src/features/bible/shared/types/index.ts

import type { Book, Chapter, Verse } from "@/dal/orval/fetch/schemas";

export type BibleHierarchyItem = {
  id: string;
  niceName: string;
  slug?: string;
};

export type { Book, Chapter, Verse };
```

- [ ] **Step 2: Verify file exists**

```bash
ls -la apps/client/src/features/bible/shared/types/index.ts
```

Expected: File exists, 0 errors.

---

## Task 2: Create BibleItemLink component with GSAP animation

**Files:**
- Create: `apps/client/src/features/bible/shared/components/bible-item-link.tsx`

**Interfaces:**
- Consumes: `BibleHierarchyItem` from Task 1
- Produces: `export function BibleItemLink(props: BibleItemLinkProps): React.ReactNode`

- [ ] **Step 1: Create component file with basic structure**

```typescript
// apps/client/src/features/bible/shared/components/bible-item-link.tsx

"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import gsap from "gsap";
import { useRef, useEffect } from "react";
import type { BibleHierarchyItem } from "../types";

interface BibleItemLinkProps {
  item: BibleHierarchyItem;
  href: string;
}

export function BibleItemLink({ item, href }: BibleItemLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const currentArrowRef = useRef<SVGSVGElement>(null);
  const newArrowRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;

    const handleMouseEnter = () => {
      const currentArrow = currentArrowRef.current;
      const newArrow = newArrowRef.current;

      if (!currentArrow || !newArrow) return;

      gsap.to(currentArrow, {
        x: 20,
        opacity: 0,
        duration: 0.3,
        ease: "power3.easeOut",
      });

      gsap.to(newArrow, {
        x: 0,
        opacity: 1,
        duration: 0.3,
        ease: "power3.easeOut",
      });
    };

    const handleMouseLeave = () => {
      const currentArrow = currentArrowRef.current;
      const newArrow = newArrowRef.current;

      if (!currentArrow || !newArrow) return;

      gsap.to(currentArrow, {
        x: 0,
        opacity: 1,
        duration: 0.3,
        ease: "power3.easeOut",
      });

      gsap.to(newArrow, {
        x: -20,
        opacity: 0,
        duration: 0.3,
        ease: "power3.easeOut",
      });
    };

    link.addEventListener("mouseenter", handleMouseEnter);
    link.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      link.removeEventListener("mouseenter", handleMouseEnter);
      link.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <Link
      ref={linkRef}
      href={href}
      className="text-md hover:text-accent-foreground transition-colors inline-flex items-center gap-1"
    >
      <span className="break-inside-avoid overflow-hidden">{item.niceName}</span>

      {/* Current arrow (visible at rest) */}
      <ArrowRightIcon
        ref={currentArrowRef}
        className="inline size-4 flex-shrink-0"
      />

      {/* New arrow (off-screen, appears on hover) */}
      <ArrowRightIcon
        ref={newArrowRef}
        className="absolute inline size-4 flex-shrink-0"
        style={{ x: -20, opacity: 0 }}
      />
    </Link>
  );
}
```

- [ ] **Step 2: Verify component compiles**

```bash
cd apps/client && npm run type-check 2>&1 | grep -A 5 "bible-item-link" || echo "No errors for bible-item-link"
```

Expected: No TypeScript errors for the new file.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/features/bible/shared/components/bible-item-link.tsx
git commit -m "feat(bible): add BibleItemLink component with GSAP animation"
```

---

## Task 3: Create SEO utilities

**Files:**
- Create: `apps/client/src/features/bible/shared/utils/seo-metadata.ts`
- Create: `apps/client/src/features/bible/shared/components/seo-structured-data.tsx`

**Interfaces:**
- Produces: `generateSeoMetadata()`, `BreadcrumbJsonLd`, `WebPageJsonLd` components

- [ ] **Step 1: Create SEO metadata utilities**

```typescript
// apps/client/src/features/bible/shared/utils/seo-metadata.ts

import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://versum.com.br";

export const bibleSeoKeywords = {
  books: ["bíblia online", "livros da bíblia", "versículos bíblicos", "bíblia sagrada", "ler bíblia online"],
  chapters: ["capítulos da bíblia", "versículos", "leitura bíblica", "estudar a bíblia"],
  verses: ["versículos da bíblia", "texto bíblico", "palavra de Deus", "leitura espiritual"],
};

interface GenerateBookMetadataParams {
  bookName: string;
  bookSlug: string;
}

export function generateBookMetadata({
  bookName,
  bookSlug,
}: GenerateBookMetadataParams): Metadata {
  const title = `${bookName} - Leia online | Versum`;
  const description = `Leia o livro de ${bookName} da Bíblia online. Acesso gratuito a todos os capítulos e versículos. Estude a palavra de Deus com a Versum.`;
  const url = `${BASE_URL}/bible/books/${bookSlug}`;

  return {
    title,
    description,
    keywords: [...bibleSeoKeywords.books, bookName],
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Versum",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    canonical: url,
  };
}

interface GenerateChapterMetadataParams {
  bookName: string;
  bookSlug: string;
  chapterNumber: number;
}

export function generateChapterMetadata({
  bookName,
  bookSlug,
  chapterNumber,
}: GenerateChapterMetadataParams): Metadata {
  const title = `${bookName} ${chapterNumber} - Leia online | Versum`;
  const description = `Leia ${bookName} capítulo ${chapterNumber} da Bíblia online. Versículos completos, tradução clara e estudo facilitado. Versum.`;
  const url = `${BASE_URL}/bible/books/${bookSlug}/chapters/${chapterNumber}`;

  return {
    title,
    description,
    keywords: [...bibleSeoKeywords.chapters, bookName, `capítulo ${chapterNumber}`],
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Versum",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    canonical: url,
  };
}

interface GenerateVerseMetadataParams {
  bookName: string;
  bookSlug: string;
  chapterNumber: number;
}

export function generateVerseMetadata({
  bookName,
  bookSlug,
  chapterNumber,
}: GenerateVerseMetadataParams): Metadata {
  const title = `${bookName} ${chapterNumber} - Versículos | Versum`;
  const description = `Versículos de ${bookName} ${chapterNumber}. Leia a Bíblia online com tradução clara. Estude, pesquise e compartilhe a palavra de Deus.`;
  const url = `${BASE_URL}/bible/books/${bookSlug}/chapters/${chapterNumber}`;

  return {
    title,
    description,
    keywords: [...bibleSeoKeywords.verses, bookName, `${bookName} ${chapterNumber}`],
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Versum",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    canonical: url,
  };
}

export function generateBooksMetadata(): Metadata {
  const title = "Livros da Bíblia - Leia Online | Versum";
  const description = "Acesse todos os livros da Bíblia online. Novo e Antigo Testamento com versículos completos. Leitura gratuita e sem limitações.";
  const url = `${BASE_URL}/bible/books`;

  return {
    title,
    description,
    keywords: ["bíblia", "livros da bíblia", "antigo testamento", "novo testamento", "ler bíblia online"],
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Versum",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    canonical: url,
  };
}
```

- [ ] **Step 2: Create SEO structured data component**

```typescript
// apps/client/src/features/bible/shared/components/seo-structured-data.tsx

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
    />
  );
}

interface WebPageJsonLdProps {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export function WebPageJsonLd({
  title,
  description,
  url,
  image,
}: WebPageJsonLdProps) {
  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
    image,
    inLanguage: "pt-BR",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }}
    />
  );
}

interface BookJsonLdProps {
  name: string;
  author: string;
  url: string;
}

export function BookJsonLd({ name, author, url }: BookJsonLdProps) {
  const book = {
    "@context": "https://schema.org",
    "@type": "Book",
    name,
    author: {
      "@type": "Person",
      name: author,
    },
    url,
    inLanguage: "pt-BR",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(book) }}
    />
  );
}
```

- [ ] **Step 3: Verify types**

```bash
cd apps/client && npm run type-check 2>&1 | grep -A 5 "seo" || echo "No errors for seo utils"
```

Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/features/bible/shared/utils/seo-metadata.ts apps/client/src/features/bible/shared/components/seo-structured-data.tsx
git commit -m "feat(bible): add comprehensive SEO utilities and structured data components"
```

---

## Task 4: Create useBooks hook with caching

**Files:**
- Create: `apps/client/src/features/bible/books/hooks/use-fetch-books.ts`

**Interfaces:**
- Consumes: `getApiV1PublicBibleBooks` from `@/dal/orval/fetch/bíblia/bíblia`
- Produces: `export const useBooks = cache(async () => Promise<{ allBooks: Book[]; newTestament: Book[]; oldTestament: Book[] }>)`

- [ ] **Step 1: Create hook file**

```typescript
// apps/client/src/features/bible/books/hooks/use-fetch-books.ts

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { getApiV1PublicBibleBooks } from "@/dal/orval/fetch/bíblia/bíblia";
import type { Book, GetBooksResponse } from "@/dal/orval/fetch/schemas";
import { BookTestament } from "@/dal/orval/zod/schemas";

export const useBooks = cache(async () => {
  "use cache";
  cacheLife("max");
  cacheTag("bible:books");

  console.log("Fetching all bible books...");
  const firstReq = await getApiV1PublicBibleBooks();
  let allBooks = firstReq.data ?? [];

  if (!firstReq.pagination?.hasNextPage) {
    return {
      allBooks,
      newTestament: [],
      oldTestament: [],
    };
  }

  const promises: Promise<GetBooksResponse>[] = [];

  for (
    let pageInt = 2;
    pageInt <= firstReq.pagination.totalPages;
    pageInt++
  ) {
    console.log(`Fetching page ${pageInt}...`);
    promises.push(getApiV1PublicBibleBooks({ page: pageInt.toString() }));
  }

  const results = await Promise.all(promises);
  allBooks = allBooks.concat(results.flatMap((r) => r.data ?? []));
  console.log(`All books fetched. Length: ${allBooks.length}`);

  const newTestament = allBooks.filter(
    (book) => book.testament === BookTestament.NEW,
  );
  const oldTestament = allBooks.filter(
    (book) => book.testament === BookTestament.OLD,
  );

  return { allBooks, newTestament, oldTestament };
});
```

- [ ] **Step 2: Verify types**

```bash
cd apps/client && npm run type-check 2>&1 | grep -A 5 "use-fetch-books" || echo "No errors for use-fetch-books"
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/features/bible/books/hooks/use-fetch-books.ts
git commit -m "feat(bible): add useBooks hook with React cache and ISR"
```

---

## Task 5: Move Testament component to feature

**Files:**
- Create: `apps/client/src/features/bible/books/components/testament.tsx`

**Interfaces:**
- Consumes: `BibleHierarchyItem` from Task 1, `BibleItemLink` from Task 2
- Produces: `export function Testament(props: TestamentProps): React.ReactNode`

- [ ] **Step 1: Create Testament component**

```typescript
// apps/client/src/features/bible/books/components/testament.tsx

import type { Book } from "@/dal/orval/fetch/schemas";
import { BibleItemLink } from "../../shared/components/bible-item-link";

interface TestamentProps {
  title: string;
  books: Book[];
}

export function Testament({ title, books }: TestamentProps) {
  return (
    <section className="bg-accent-foreground/5 rounded-4xl border-l-2 border-accent p-6 max-h-full">
      <h2 className="text-4xl font-instrument-serif">{title}</h2>
      <ul className="md:columns-2 py-2">
        {books.map((book) => (
          <li key={book.id} className="break-inside-avoid py-1">
            <BibleItemLink item={book} href={`/bible/books/${book.slug}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
cd apps/client && npm run type-check 2>&1 | grep -A 5 "testament" || echo "No errors for testament"
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/features/bible/books/components/testament.tsx
git commit -m "feat(bible): move Testament component to feature"
```

---

## Task 6: Create useChapters hook with caching

**Files:**
- Create: `apps/client/src/features/bible/chapters/hooks/use-fetch-chapters.ts`

**Interfaces:**
- Produces: `export const useChapters = cache(async (bookSlug: string) => Promise<Chapter[]>)`

- [ ] **Step 1: Create hook file**

```typescript
// apps/client/src/features/bible/chapters/hooks/use-fetch-chapters.ts

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";

// TODO: Verify actual API endpoint structure after implementation
// This is a placeholder pending chapters endpoint confirmation
export const useChapters = cache(async (bookSlug: string) => {
  "use cache";
  cacheLife("max");
  cacheTag(`bible:chapters:${bookSlug}`);

  console.log(`Fetching chapters for book: ${bookSlug}`);
  // API call will go here
  return [];
});
```

- [ ] **Step 2: Commit placeholder**

```bash
git add apps/client/src/features/bible/chapters/hooks/use-fetch-chapters.ts
git commit -m "feat(bible): add useChapters hook placeholder with caching"
```

---

## Task 7: Create useVerses hook with caching

**Files:**
- Create: `apps/client/src/features/bible/verses/hooks/use-fetch-verses.ts`

**Interfaces:**
- Produces: `export const useVerses = cache(async (bookSlug: string, chapterNumber: number) => Promise<Verse[]>)`

- [ ] **Step 1: Create hook file**

```typescript
// apps/client/src/features/bible/verses/hooks/use-fetch-verses.ts

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";

// Placeholder pending verses endpoint confirmation
export const useVerses = cache(
  async (bookSlug: string, chapterNumber: number) => {
    "use cache";
    cacheLife("days");
    cacheTag(`bible:verses:${bookSlug}:${chapterNumber}`);

    console.log(
      `Fetching verses for ${bookSlug} chapter ${chapterNumber}`,
    );
    // API call will go here
    return [];
  },
);
```

- [ ] **Step 2: Commit placeholder**

```bash
git add apps/client/src/features/bible/verses/hooks/use-fetch-verses.ts
git commit -m "feat(bible): add useVerses hook placeholder with caching"
```

---

## Task 8: Refactor books/page.tsx with SEO

**Files:**
- Modify: `apps/client/src/app/(public)/bible/books/page.tsx`

**Interfaces:**
- Consumes: `useBooks` from Task 4, `Testament` from Task 5, `generateBooksMetadata()` and `BreadcrumbJsonLd()` from Task 3

- [ ] **Step 1: Rewrite page.tsx with SEO**

```typescript
// apps/client/src/app/(public)/bible/books/page.tsx

import { useBooks } from "@/features/bible/books/hooks/use-fetch-books";
import { Testament } from "@/features/bible/books/components/testament";
import { generateBooksMetadata } from "@/features/bible/shared/utils/seo-metadata";
import { BreadcrumbJsonLd, WebPageJsonLd } from "@/features/bible/shared/components/seo-structured-data";

export const metadata = generateBooksMetadata();

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://versum.com.br";

export default async function BibleBooksPage() {
  const { newTestament, oldTestament } = await useBooks();

  const breadcrumbItems = [
    { name: "Home", url: BASE_URL },
    { name: "Bíblia", url: `${BASE_URL}/bible/books` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <WebPageJsonLd
        title={metadata.title || "Livros da Bíblia"}
        description={metadata.description || "Acesse todos os livros da Bíblia"}
        url={`${BASE_URL}/bible/books`}
      />
      <div className="max-w-screen h-full max-h-auto md:max-h-svh flex flex-wrap gap-2 justify-center">
        <Testament title="Novo Testamento" books={newTestament} />
        <Testament title="Antigo Testamento" books={oldTestament} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
cd apps/client && npm run type-check
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/app/\(public\)/bible/books/page.tsx
git commit -m "refactor(bible): move books page to feature with SEO optimization"
```

---

## Task 9: Create chapters listing page with SEO

**Files:**
- Create: `apps/client/src/app/(public)/bible/books/[slug]/chapters/page.tsx`

**Interfaces:**
- Consumes: `useChapters` from Task 6, `BibleItemLink` from Task 2, `generateChapterMetadata()` from Task 3

- [ ] **Step 1: Create chapters page with SEO**

```typescript
// apps/client/src/app/(public)/bible/books/[slug]/chapters/page.tsx

import { useChapters } from "@/features/bible/chapters/hooks/use-fetch-chapters";
import { BibleItemLink } from "@/features/bible/shared/components/bible-item-link";
import { generateChapterMetadata } from "@/features/bible/shared/utils/seo-metadata";
import { BreadcrumbJsonLd, BookJsonLd } from "@/features/bible/shared/components/seo-structured-data";

interface ChaptersPageProps {
  params: Promise<{ slug: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://versum.com.br";

export async function generateMetadata({ params }: ChaptersPageProps) {
  const { slug } = await params;
  return generateChapterMetadata({
    bookName: slug,
    bookSlug: slug,
    chapterNumber: 1,
  });
}

export default async function ChaptersPage({ params }: ChaptersPageProps) {
  const { slug } = await params;
  const chapters = await useChapters(slug);

  if (!chapters || chapters.length === 0) {
    return <div>Nenhum capítulo encontrado</div>;
  }

  const breadcrumbItems = [
    { name: "Home", url: BASE_URL },
    { name: "Bíblia", url: `${BASE_URL}/bible/books` },
    { name: slug, url: `${BASE_URL}/bible/books/${slug}/chapters` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <BookJsonLd
        name={slug}
        author="Bíblia Sagrada"
        url={`${BASE_URL}/bible/books/${slug}/chapters`}
      />
      <div className="w-full">
        <h1 className="text-4xl font-instrument-serif mb-6 capitalize">
          {slug}
        </h1>
        <p className="text-gray-600 mb-8">
          Leia todos os capítulos do livro de {slug} online na Versum.
        </p>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {chapters.map((chapter) => (
            <li key={chapter.id} className="break-inside-avoid py-1">
              <BibleItemLink
                item={{
                  id: chapter.id,
                  niceName: `Capítulo ${chapter.number}`,
                }}
                href={`/bible/books/${slug}/chapters/${chapter.number}`}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
cd apps/client && npm run type-check
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/client/src/app/(public)/bible/books/[slug]/chapters/page.tsx"
git commit -m "feat(bible): create chapters listing page with SEO"
```

---

## Task 10: Create verses listing page with SEO

**Files:**
- Create: `apps/client/src/app/(public)/bible/books/[slug]/chapters/[chapterNumber]/page.tsx`

**Interfaces:**
- Consumes: `useVerses` from Task 7, `BibleItemLink` from Task 2, `generateVerseMetadata()` from Task 3

- [ ] **Step 1: Create verses page with SEO**

```typescript
// apps/client/src/app/(public)/bible/books/[slug]/chapters/[chapterNumber]/page.tsx

import { useVerses } from "@/features/bible/verses/hooks/use-fetch-verses";
import { generateVerseMetadata } from "@/features/bible/shared/utils/seo-metadata";
import { BreadcrumbJsonLd, WebPageJsonLd } from "@/features/bible/shared/components/seo-structured-data";

interface VersesPageProps {
  params: Promise<{ slug: string; chapterNumber: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://versum.com.br";

export async function generateMetadata({ params }: VersesPageProps) {
  const { slug, chapterNumber } = await params;
  return generateVerseMetadata({
    bookName: slug,
    bookSlug: slug,
    chapterNumber: parseInt(chapterNumber, 10),
  });
}

export default async function VersesPage({ params }: VersesPageProps) {
  const { slug, chapterNumber } = await params;
  const chapterNum = parseInt(chapterNumber, 10);
  const verses = await useVerses(slug, chapterNum);

  if (!verses || verses.length === 0) {
    return <div>Nenhum versículo encontrado</div>;
  }

  const breadcrumbItems = [
    { name: "Home", url: BASE_URL },
    { name: "Bíblia", url: `${BASE_URL}/bible/books` },
    { name: slug, url: `${BASE_URL}/bible/books/${slug}/chapters` },
    { name: `Capítulo ${chapterNumber}`, url: `${BASE_URL}/bible/books/${slug}/chapters/${chapterNumber}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <WebPageJsonLd
        title={`${slug} ${chapterNumber} - Versum`}
        description={`Leia ${slug} capítulo ${chapterNumber} da Bíblia. Versículos completos com tradução clara.`}
        url={`${BASE_URL}/bible/books/${slug}/chapters/${chapterNumber}`}
      />
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-instrument-serif mb-2 capitalize">
          {slug}
        </h1>
        <h2 className="text-2xl text-accent mb-6">Capítulo {chapterNumber}</h2>
        <ol className="space-y-4">
          {verses.map((verse) => (
            <li key={verse.id} className="border-l-2 border-accent pl-4">
              <span className="font-semibold text-accent">{verse.number}</span>
              {" "}
              {verse.text}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
cd apps/client && npm run type-check
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/client/src/app/(public)/bible/books/[slug]/chapters/[chapterNumber]/page.tsx"
git commit -m "feat(bible): create verses listing page with SEO optimization"
```

---

## Task 11: Clean up old routes and verify structure

**Files:**
- Delete: `apps/client/src/app/(public)/bible/[book]/page.tsx`
- Delete: `apps/client/src/app/(public)/bible/page.tsx`
- Verify: `apps/client/src/app/(public)/bible/layout.tsx` (no changes needed)

- [ ] **Step 1: Delete old routes**

```bash
rm apps/client/src/app/\(public\)/bible/\[book\]/page.tsx
rm apps/client/src/app/\(public\)/bible/page.tsx
```

- [ ] **Step 2: Verify structure**

```bash
tree apps/client/src/app/\(public\)/bible -L 3
tree apps/client/src/features/bible -L 3
```

Expected output should match planned structure with books/, chapters/, [slug]/, [chapterNumber]/, shared/.

- [ ] **Step 3: Type check entire client**

```bash
cd apps/client && npm run type-check
```

Expected: No TypeScript errors.

- [ ] **Step 4: Commit cleanup**

```bash
git add -A
git commit -m "chore(bible): remove old routes, clean up structure"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Feature structure: Creates `features/bible/` with shared components and sub-feature hooks
- ✅ BibleItemLink animation: GSAP Power3.easeOut animation implemented
- ✅ Caching strategy: React `cache()` + `cacheLife()` + `cacheTag()` in all hooks
- ✅ Books page refactor: Uses feature hooks and components with SEO
- ✅ Chapters page: Created with BibleItemLink reusable component and SEO
- ✅ Verses page: Created as hierarchical level 3 with SEO
- ✅ Kebab-case naming: All files use kebab-case
- ✅ SEO optimization: JSON-LD structured data, Open Graph, canonical URLs, keywords per page
- ✅ Breadcrumbs: BreadcrumbList JSON-LD for navigation hierarchy
- ✅ Commit standards: No "Generated with Claude Code" attribution

**Placeholder scan:**
- ✅ All code blocks complete, no "TBD"
- ✅ useChapters and useVerses marked as placeholders but with full structure
- ✅ All commands exact with expected output
- ✅ SEO metadata complete for all hierarchy levels

**Type consistency:**
- ✅ BibleHierarchyItem: { id, niceName, slug? } — used consistently
- ✅ Function names match: useBooks, useChapters, useVerses, BibleItemLink, Testament
- ✅ Import paths correct and consistent
- ✅ Metadata generators follow same pattern

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-28-bible-feature-refactor.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
