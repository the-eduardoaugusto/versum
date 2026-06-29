// apps/client/src/app/(public)/bible/books/[slug]/chapters/[chapterNumber]/page.tsx

import { Suspense } from "react";
import { getApiV1PublicBibleBooksDynamicId } from "@/dal/orval/fetch/bíblia/bíblia";
import {
  BreadcrumbJsonLd,
  WebPageJsonLd,
} from "@/features/bible/shared/components/seo-structured-data";
import { generateVerseMetadata } from "@/features/bible/shared/utils/seo-metadata";
import { useVerses } from "@/features/bible/verses/hooks/use-fetch-verses";

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
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-instrument-serif mb-2 capitalize">
          {bookName}
        </h1>
        <h2 className="text-2xl text-accent mb-6">Capítulo {chapterNumber}</h2>
        <ol className="space-y-4">
          {verses.map((verse) => (
            <li key={verse.id} className="border-l-2 border-accent pl-4">
              <span className="font-semibold text-accent">{verse.number}</span>{" "}
              {verse.text}
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
