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
        title={"Livros da Bíblia - Leia Online | Versum"}
        description={
          "Acesse todos os livros da Bíblia online. Novo e Antigo Testamento com versículos completos. Leitura gratuita e sem limitações."
        }
        url={`${BASE_URL}/bible/books`}
      />
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-instrument-serif">
            Bíblia
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Leia todos os livros da Bíblia online na Versum.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Testament title="Novo Testamento" books={newTestament} />
          <Testament title="Antigo Testamento" books={oldTestament} />
        </div>
      </div>
    </>
  );
}
