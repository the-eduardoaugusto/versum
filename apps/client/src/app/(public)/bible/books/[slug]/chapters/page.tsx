// apps/client/src/app/(public)/bible/books/[slug]/chapters/page.tsx

import type { Metadata } from "next";
import { Suspense } from "react";
import { getApiV1PublicBibleBooksDynamicId } from "@/dal/orval/fetch/bíblia/bíblia";
import { useChapters } from "@/features/bible/chapters/hooks/use-fetch-chapters";
import { BibleBreadcrumb } from "@/features/bible/shared/components/bible-breadcrumb";
import { BibleItemLink } from "@/features/bible/shared/components/bible-item-link";
import {
  BookJsonLd,
  BreadcrumbJsonLd,
} from "@/features/bible/shared/components/seo-structured-data";
import { generateChapterMetadata } from "@/features/bible/shared/utils/seo-metadata";

interface ChaptersPageProps {
  params: Promise<{ slug: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://versum.com.br";

export async function generateMetadata({
  params,
}: ChaptersPageProps): Promise<Metadata> {
  const { slug } = await params;
  const bookRes = await getApiV1PublicBibleBooksDynamicId(slug);
  const bookName = bookRes.data?.niceName ?? slug;
  return generateChapterMetadata({
    bookName,
    bookSlug: slug,
    chapterNumber: 1,
  });
}

async function ChaptersContent({ params }: ChaptersPageProps) {
  const { slug } = await params;
  const [bookRes, chapters] = await Promise.all([
    getApiV1PublicBibleBooksDynamicId(slug),
    useChapters(slug),
  ]);
  const bookName = bookRes.data?.niceName ?? slug;

  if (!chapters || chapters.length === 0) {
    return <div>Nenhum capítulo encontrado</div>;
  }

  const breadcrumbItems = [
    { name: "Home", url: BASE_URL },
    { name: "Bíblia", url: `${BASE_URL}/bible/books` },
    { name: bookName, url: `${BASE_URL}/bible/books/${slug}/chapters` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <BookJsonLd
        name={bookName}
        author="Bíblia Sagrada"
        url={`${BASE_URL}/bible/books/${slug}/chapters`}
      />
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <BibleBreadcrumb
          items={[
            { label: "Bíblia", href: "/bible/books" },
            { label: bookName },
          ]}
        />
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-instrument-serif capitalize leading-tight">
            {bookName}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Leia todos os capítulos do livro de {bookName} online na Versum.
          </p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {chapters.map((chapter) => (
            <li
              key={chapter.id}
              className="break-inside-avoid rounded-lg px-3 py-2 hover:bg-accent/10 transition-all duration-200"
            >
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

export default function ChaptersPage(props: ChaptersPageProps) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ChaptersContent {...props} />
    </Suspense>
  );
}
