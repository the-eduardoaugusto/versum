// apps/client/src/app/(public)/bible/books/[slug]/chapters/page.tsx

import type { Metadata } from "next";
import { Suspense } from "react";
import { getApiV1PublicBibleBooksDynamicId } from "@/dal/orval/fetch/bíblia/bíblia";
import { useChapters } from "@/features/bible/chapters/hooks/use-fetch-chapters";
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
      <div className="w-full">
        <h1 className="text-4xl font-instrument-serif mb-6 capitalize">
          {bookName}
        </h1>
        <p className="text-gray-600 mb-8">
          Leia todos os capítulos do livro de {bookName} online na Versum.
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

export default function ChaptersPage(props: ChaptersPageProps) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ChaptersContent {...props} />
    </Suspense>
  );
}
