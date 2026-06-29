// apps/client/src/app/(public)/bible/books/[slug]/chapters/[chapterNumber]/page.tsx

import { Suspense } from "react";
import { getApiV1PublicBibleBooksDynamicId } from "@/dal/orval/fetch/bíblia/bíblia";
import {
  BreadcrumbJsonLd,
  WebPageJsonLd,
} from "@/features/bible/shared/components/seo-structured-data";
import { generateVerseMetadata } from "@/features/bible/shared/utils/seo-metadata";
import { useVerses } from "@/features/bible/verses/hooks/use-fetch-verses";

export const revalidate = 604800; // 7 days

export async function generateStaticParams() {
  // Return empty — pages are generated on first visit (on-demand ISR)
  return [];
}

interface VersesPageProps {
  params: Promise<{ slug: string; chapterNumber: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://versum.com.br";

export async function generateMetadata({ params }: VersesPageProps) {
  const { slug, chapterNumber } = await params;
  const bookRes = await getApiV1PublicBibleBooksDynamicId(slug);
  const bookName = bookRes.data?.niceName ?? slug;
  return generateVerseMetadata({
    bookName,
    bookSlug: slug,
    chapterNumber: parseInt(chapterNumber, 10),
  });
}

async function VersesContent({ params }: VersesPageProps) {
  const { slug, chapterNumber } = await params;
  const chapterNum = parseInt(chapterNumber, 10);

  const [bookRes, verses] = await Promise.all([
    getApiV1PublicBibleBooksDynamicId(slug),
    useVerses(slug, chapterNum),
  ]);
  const bookName = bookRes.data?.niceName ?? slug;

  if (!verses || verses.length === 0) {
    return <div>Nenhum versículo encontrado</div>;
  }

  const breadcrumbItems = [
    { name: "Home", url: BASE_URL },
    { name: "Bíblia", url: `${BASE_URL}/bible/books` },
    { name: bookName, url: `${BASE_URL}/bible/books/${slug}/chapters` },
    {
      name: `Capítulo ${chapterNumber}`,
      url: `${BASE_URL}/bible/books/${slug}/chapters/${chapterNumber}`,
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <WebPageJsonLd
        title={`${bookName} ${chapterNumber} - Versículos | Versum`}
        description={`Leia ${bookName} capítulo ${chapterNumber} da Bíblia. Versículos completos com tradução clara.`}
        url={`${BASE_URL}/bible/books/${slug}/chapters/${chapterNumber}`}
      />
      <div className="w-full max-w-2xl mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="space-y-1 mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-instrument-serif capitalize leading-tight">
            {bookName}
          </h1>
          <h2 className="text-lg md:text-xl text-accent-foreground font-medium">
            Capítulo {chapterNumber}
          </h2>
        </div>
        <ol className="space-y-1">
          {verses.map((verse) => (
            <li
              key={verse.id}
              className="flex gap-3 px-4 py-3 rounded-lg hover:bg-accent/10 transition-all duration-200 group"
            >
              <span className="text-accent-foreground font-semibold text-sm tabular-nums min-w-[1.5rem] pt-0.5 select-none">
                {verse.number}
              </span>
              <span className="text-base leading-relaxed">{verse.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

export default function VersesPage(props: VersesPageProps) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <VersesContent {...props} />
    </Suspense>
  );
}
