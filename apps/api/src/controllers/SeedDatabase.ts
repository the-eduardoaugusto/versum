import { Controller, Get, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { prisma } from "../libs/prisma";

// Define a estrutura do JSON
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
export class SeedDatabaseController {
  @Get()
  async seedDatabase(@Res() res: ResponseServer) {
    try {
      const url =
        "https://raw.githubusercontent.com/fidalgobr/bibliaAveMariaJSON/refs/heads/main/bibliaAveMariaRAW.json";

      console.log("Baixando JSON do GitHub...");
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Erro ao buscar JSON: ${response.status} ${response.statusText}`
        );
      }

      const bible: Biblia = (await response.json()) as Biblia;
      console.log("JSON carregado com sucesso!");

      // Limpa banco antes de popular (opcional - remova se não quiser)
      console.log("Limpando banco de dados...");
      await prisma.versiculo.deleteMany();
      await prisma.capitulo.deleteMany();
      await prisma.livro.deleteMany();

      let totalVersiculos = 0;
      let ordemLivro = 1;

      // Processa Antigo Testamento
      console.log("Processando Antigo Testamento...");
      for (const livroData of bible.antigoTestamento) {
        const livro = await prisma.livro.create({
          data: {
            nome: livroData.nome,
            ordem: ordemLivro++,
            testamento: "antigo",
            totalCapitulos: livroData.capitulos.length,
          },
        });

        for (const capituloData of livroData.capitulos) {
          const capitulo = await prisma.capitulo.create({
            data: {
              livroId: livro.id,
              numero: capituloData.capitulo,
              totalVersiculos: capituloData.versiculos.length,
            },
          });

          // Prepara versículos do capítulo para inserção em batch
          const versiculos = capituloData.versiculos.map((vers) => ({
            capituloId: capitulo.id,
            numero: vers.versiculo,
            texto: vers.texto,
          }));

          await prisma.versiculo.createMany({
            data: versiculos,
            skipDuplicates: true,
          });

          totalVersiculos += versiculos.length;
        }

        console.log(
          `✓ ${livroData.nome} - ${livroData.capitulos.length} capítulos`
        );
      }

      // Processa Novo Testamento
      console.log("\nProcessando Novo Testamento...");
      for (const livroData of bible.novoTestamento) {
        const livro = await prisma.livro.create({
          data: {
            nome: livroData.nome,
            ordem: ordemLivro++,
            testamento: "novo",
            totalCapitulos: livroData.capitulos.length,
          },
        });

        for (const capituloData of livroData.capitulos) {
          const capitulo = await prisma.capitulo.create({
            data: {
              livroId: livro.id,
              numero: capituloData.capitulo,
              totalVersiculos: capituloData.versiculos.length,
            },
          });

          // Prepara versículos do capítulo para inserção em batch
          const versiculos = capituloData.versiculos.map((vers) => ({
            capituloId: capitulo.id,
            numero: vers.versiculo,
            texto: vers.texto,
          }));

          await prisma.versiculo.createMany({
            data: versiculos,
            skipDuplicates: true,
          });

          totalVersiculos += versiculos.length;
        }

        console.log(
          `✓ ${livroData.nome} - ${livroData.capitulos.length} capítulos`
        );
      }

      console.log("\n=== Seed finalizado! ===");
      console.log(`Total de livros: ${ordemLivro - 1}`);
      console.log(`Total de versículos: ${totalVersiculos}`);

      return res.status(200).json({
        success: true,
        message: "Seed finalizado com sucesso!",
        stats: {
          totalLivros: ordemLivro - 1,
          totalVersiculos,
          antigoTestamento: bible.antigoTestamento.length,
          novoTestamento: bible.novoTestamento.length,
        },
      });
    } catch (error) {
      console.error("Erro no seed:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao fazer seed do banco de dados",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
}
