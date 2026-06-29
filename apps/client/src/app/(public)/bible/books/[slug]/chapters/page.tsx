// apps/client/src/app/(public)/bible/books/[slug]/chapters/page.tsx

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
