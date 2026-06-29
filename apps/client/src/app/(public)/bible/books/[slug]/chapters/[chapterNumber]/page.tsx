// apps/client/src/app/(public)/bible/books/[slug]/chapters/[chapterNumber]/page.tsx

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
    {
      name: `Capítulo ${chapterNumber}`,
      url: `${BASE_URL}/bible/books/${slug}/chapters/${chapterNumber}`,
    },
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
              <span className="font-semibold text-accent">{verse.number}</span>{" "}
              {verse.text}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
