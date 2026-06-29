import { Testament } from "@/features/bible/books/components/testament";
import { useBooks } from "@/features/bible/books/hooks/use-fetch-books";
import {
  BreadcrumbJsonLd,
  WebPageJsonLd,
} from "@/features/bible/shared/components/seo-structured-data";
import { generateBooksMetadata } from "@/features/bible/shared/utils/seo-metadata";

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
