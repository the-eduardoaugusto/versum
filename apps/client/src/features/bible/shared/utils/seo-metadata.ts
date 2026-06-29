// apps/client/src/features/bible/shared/utils/seo-metadata.ts

import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://versum.com.br";

export const bibleSeoKeywords = {
  books: [
    "bíblia online",
    "livros da bíblia",
    "versículos bíblicos",
    "bíblia sagrada",
    "ler bíblia online",
  ],
  chapters: [
    "capítulos da bíblia",
    "versículos",
    "leitura bíblica",
    "estudar a bíblia",
  ],
  verses: [
    "versículos da bíblia",
    "texto bíblico",
    "palavra de Deus",
    "leitura espiritual",
  ],
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
    keywords: [
      ...bibleSeoKeywords.chapters,
      bookName,
      `capítulo ${chapterNumber}`,
    ],
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
    keywords: [
      ...bibleSeoKeywords.verses,
      bookName,
      `${bookName} ${chapterNumber}`,
    ],
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
  };
}

export function generateBooksMetadata(): Metadata {
  const title = "Livros da Bíblia - Leia Online | Versum";
  const description =
    "Acesse todos os livros da Bíblia online. Novo e Antigo Testamento com versículos completos. Leitura gratuita e sem limitações.";
  const url = `${BASE_URL}/bible/books`;

  return {
    title,
    description,
    keywords: [
      "bíblia",
      "livros da bíblia",
      "antigo testamento",
      "novo testamento",
      "ler bíblia online",
    ],
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
  };
}
