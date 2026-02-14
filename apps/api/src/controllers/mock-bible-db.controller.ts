/**
 * Script para gerar mock da Bíblia seguindo o schema do banco
 * Saída: /src/db/__mocks__/bible-db.json
 */

import fs from "node:fs/promises";
import path from "node:path";

interface Versiculo {
  versiculo: number;
  texto: string;
}

interface Capitulo {
  capitulo: number;
  versiculos: Versiculo[];
}

interface Livro {
  nome: string;
  capitulos: Capitulo[];
}

interface Biblia {
  antigoTestamento: Livro[];
  novoTestamento: Livro[];
}

type Testament = "OLD" | "NEW";

interface MockBibleDB {
  books: {
    id: string;
    name: string;
    order: number;
    testament: Testament;
    totalChapters: number;
  }[];

  chapters: {
    id: string;
    bookId: string;
    number: number;
    totalVerses: number;
  }[];

  verses: {
    id: string;
    chapterId: string;
    number: number;
    text: string;
  }[];
}

function randomId() {
  return crypto.randomUUID();
}

async function run() {
  console.log("📡 Buscando JSON remoto...");

  const url =
    "https://raw.githubusercontent.com/fidalgobr/bibliaAveMariaJSON/refs/heads/main/bibliaAveMariaRAW.json";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao baixar JSON: ${response.statusText}`);
  }

  const bible = (await response.json()) as Biblia;

  const mock: MockBibleDB = {
    books: [],
    chapters: [],
    verses: [],
  };

  let order = 1;

  async function processLivro(livro: Livro, testament: Testament) {
    const bookId = randomId();

    mock.books.push({
      id: bookId,
      name: livro.nome,
      order: order++,
      testament,
      totalChapters: livro.capitulos.length,
    });

    for (const capitulo of livro.capitulos) {
      const chapterId = randomId();

      mock.chapters.push({
        id: chapterId,
        bookId,
        number: capitulo.capitulo,
        totalVerses: capitulo.versiculos.length,
      });

      for (const versiculo of capitulo.versiculos) {
        mock.verses.push({
          id: randomId(),
          chapterId,
          number: versiculo.versiculo,
          text: versiculo.texto,
        });
      }
    }
  }

  console.log("📜 Processando Antigo Testamento...");
  for (const livro of bible.antigoTestamento) {
    await processLivro(livro, "OLD");
  }

  console.log("✝️ Processando Novo Testamento...");
  for (const livro of bible.novoTestamento) {
    await processLivro(livro, "NEW");
  }

  const outputPath = path.resolve(
    process.cwd(),
    "src/db/__mocks__/bible-db.json",
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await fs.writeFile(outputPath, JSON.stringify(mock, null, 2), "utf-8");

  console.log("✅ Mock gerado com sucesso!");
  console.log("📁", outputPath);
}

run().catch((err) => {
  console.error("❌ Erro ao gerar mock:", err);
  process.exit(1);
});
