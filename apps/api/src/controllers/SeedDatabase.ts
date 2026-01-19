import { Controller, Get, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { prisma } from "@/libs/prisma";

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

@Controller("/seed")
export class SeedDebugController {
  @Get()
  async seedDatabase(@Res() res: ResponseServer) {
    console.log("🔥🔥🔥 === SEED DEBUG MODE ATIVADO === 🔥🔥🔥");

    try {
      console.log("[1] Buscando JSON remoto...");
      const url =
        "https://raw.githubusercontent.com/fidalgobr/bibliaAveMariaJSON/refs/heads/main/bibliaAveMariaRAW.json";

      const response = await fetch(url);
      console.log(
        "[1.1] Status resposta:",
        response.status,
        response.statusText,
      );

      if (!response.ok)
        throw new Error(`Falha no fetch: ${response.statusText}`);

      console.log("[2] Convertendo JSON...");
      const bible = (await response.json()) as Biblia;
      console.log("[2.1] JSON OK, estrutura:");
      console.dir(
        {
          AT: bible.antigoTestamento.length,
          NT: bible.novoTestamento.length,
        },
        { depth: 1 },
      );

      console.log("[3] Verificando livros já existentes no BD...");
      const existingBooks = await prisma.bible_book.findMany();
      console.log(`[3.1] Encontrados no BD: ${existingBooks.length}`);

      let createdBooks = 0;
      let createdChapters = 0;
      let createdVerses = 0;

      const processLivro = async (
        livroData: Livro,
        ordem: number,
        testament: "OLD" | "NEW",
      ) => {
        console.log(`\n📖 Livro: ${livroData.nome} (${testament})`);

        const existing = existingBooks.find((b) => b.name === livroData.nome);
        let livro;

        if (existing) {
          console.log("   [=] Já existe no BD");
          livro = existing;
        } else {
          console.log("   [+] Criando livro...");
          livro = await prisma.bible_book.create({
            data: {
              name: livroData.nome,
              order: ordem,
              testament,
              total_chapters: livroData.capitulos.length,
            },
          });
          createdBooks++;
          console.log("   [✔] Livro criado ID:", livro.id);
        }

        for (const capituloData of livroData.capitulos) {
          console.log(`\n       👉 Capítulo ${capituloData.capitulo}`);

          const existingChapter = await prisma.bible_chapter.findFirst({
            where: { book_id: livro.id, number: capituloData.capitulo },
          });

          let capitulo;
          if (existingChapter) {
            console.log("          [=] Capítulo já existe");
            capitulo = existingChapter;
          } else {
            console.log("          [+] Criando capítulo...");
            capitulo = await prisma.bible_chapter.create({
              data: {
                book_id: livro.id,
                number: capituloData.capitulo,
                total_verses: capituloData.versiculos.length,
              },
            });
            createdChapters++;
            console.log("          [✔] Capítulo criado ID:", capitulo.id);
          }

          const beforeCount = await prisma.bible_verse.count({
            where: { chapter_id: capitulo.id },
          });

          const versiculos = capituloData.versiculos.map((vers) => ({
            chapter_id: capitulo.id,
            number: vers.versiculo,
            text: vers.texto,
          }));

          console.log(
            `          [+] Inserindo versos (total: ${versiculos.length})...`,
          );

          await prisma.bible_verse.createMany({
            data: versiculos,
            skipDuplicates: true,
          });

          const afterCount = await prisma.bible_verse.count({
            where: { chapter_id: capitulo.id },
          });

          const inserted = afterCount - beforeCount;
          createdVerses += inserted;

          console.log(
            `          [✔] Antes: ${beforeCount} Depois: ${afterCount} (+=${inserted})`,
          );
        }
      };

      console.log("\n🚀 Processando Antigo Testamento...");
      let ordem = 1;
      for (const livro of bible.antigoTestamento) {
        await processLivro(livro, ordem++, "OLD");
      }

      console.log("\n✝️ Processando Novo Testamento...");
      for (const livro of bible.novoTestamento) {
        await processLivro(livro, ordem++, "NEW");
      }

      console.log("\n🎉 FINALIZADO!");
      console.log("📚 Livros criados:", createdBooks);
      console.log("📄 Capítulos criados:", createdChapters);
      console.log("✍️ Versículos criados:", createdVerses);

      return res.status(200).json({
        ok: true,
        createdBooks,
        createdChapters,
        createdVerses,
      });
    } catch (err: any) {
      console.error("💀 ERRO GERAL 💀:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
}
