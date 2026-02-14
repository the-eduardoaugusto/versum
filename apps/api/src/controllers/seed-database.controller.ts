import { Controller, Get, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { db } from "@/db/client";
import { bibleBooks, bibleChapters, bibleVerses } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { handleError } from "@/utils/error-handler.util";
import { Swagger } from "azurajs/swagger";
import { seedDatabaseSwagger } from "@/swaggers";

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
  private readonly WEBHOOK_URL =
    "https://discord.com/api/webhooks/1463937488962850837/kc9xkCsbzsXASyoxiMQDkWh3aQLsvejHYIf9CK6eABrg6QlGOdAjHHpg0MT5LO38zf6R";

  private messageId: string | null = null;
  private logs: string[] = [];
  private startTime: Date = new Date();
  private endTime: Date | null = null;
  private hasError: boolean = false;

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} - ${hours}h${minutes}`;
  }

  private async addLog(message: string) {
    this.logs.push(message);
    await this.updateDiscordMessage();
  }

  private async updateDiscordMessage() {
    const logsText = this.logs.join("\n");
    // Limita o tamanho da descrição pra não estourar o limite do Discord (4096 caracteres)
    const truncatedLogs =
      logsText.length > 3800 ? "...\n" + logsText.slice(-3800) : logsText;

    const embed = {
      title: `Logs do seed ${this.startTime.toISOString()}`,
      description: `**Logs:**\n\`\`\`\n${truncatedLogs}\n\`\`\``,
      fields: [
        {
          name: "Começou em:",
          value: this.formatDate(this.startTime),
          inline: true,
        },
        {
          name: "Terminou em:",
          value: this.endTime ? this.formatDate(this.endTime) : "Em andamento",
          inline: true,
        },
        {
          name: "Houve erros?:",
          value: this.hasError ? "Sim" : "Não",
          inline: true,
        },
      ],
      color: this.hasError ? 0xe74c3c : this.endTime ? 0x2ecc71 : 0xffaa00,
      timestamp: new Date().toISOString(),
    };

    try {
      if (!this.messageId) {
        // Primeira mensagem - cria
        const response = await fetch(this.WEBHOOK_URL + "?wait=true", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embeds: [embed] }),
        });

        const data = (await response.json()) as { id: string };
        this.messageId = data.id;
      } else {
        // Mensagem já existe - edita
        await fetch(`${this.WEBHOOK_URL}/messages/${this.messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embeds: [embed] }),
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar Discord:", err);
    }
  }

  @Get()
  @Swagger(seedDatabaseSwagger.seedDatabase)
  async seedDatabase(@Res() res: ResponseServer) {
    this.startTime = new Date();
    this.logs = [];
    this.endTime = null;
    this.hasError = false;
    this.messageId = null;

    console.log("🔥🔥🔥🔥 === SEED DEBUG MODE ATIVADO === 🔥🔥🔥🔥🔥");
    await this.addLog("🔥 SEED INICIADO");

    try {
      console.log("[1] Buscando JSON remoto...");
      await this.addLog("📡 Buscando JSON remoto...");

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

      await this.addLog(
        `✅ JSON OK - AT: ${bible.antigoTestamento.length} livros | NT: ${bible.novoTestamento.length} livros`,
      );

      console.log("[3] Verificando livros já existentes no BD...");
      const existingBooks = (await db.select().from(bibleBooks)) as any[];
      console.log(`[3.1] Encontrados no BD: ${existingBooks.length}`);
      await this.addLog(`🔍 Livros existentes no BD: ${existingBooks.length}`);

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
        let libro: any;

        if (existing) {
          console.log("   [=] Já existe no BD");
          libro = existing;
        } else {
          console.log("   [+] Criando livro...");
          const [newLibro] = (await db
            .insert(bibleBooks)
            .values({
              name: livroData.nome,
              order: ordem,
              testament: testament as any,
              totalChapters: livroData.capitulos.length,
            })
            .returning()) as any[];
          libro = newLibro;
          createdBooks++;
          console.log("   [✔] Livro criado ID:", libro.id);
          await this.addLog(
            `📖 [${testament}] ${livroData.nome} - ${livroData.capitulos.length} caps`,
          );
        }

        for (const capituloData of livroData.capitulos) {
          console.log(`\n       👉 Capítulo ${capituloData.capitulo}`);

          const [existingChapter] = (await db
            .select()
            .from(bibleChapters)
            .where(
              and(
                eq(bibleChapters.bookId, libro.id),
                eq(bibleChapters.number, capituloData.capitulo),
              ),
            )) as any[];

          let capitulo: any;
          if (existingChapter) {
            console.log("          [=] Capítulo já existe");
            capitulo = existingChapter;
          } else {
            console.log("          [+] Criando capítulo...");
            const [newCapitulo] = (await db
              .insert(bibleChapters)
              .values({
                bookId: libro.id,
                number: capituloData.capitulo,
                totalVerses: capituloData.versiculos.length,
              })
              .returning()) as any[];
            capitulo = newCapitulo;
            createdChapters++;
            console.log("          [✔] Capítulo criado ID:", capitulo.id);
          }

          const [countResult] = (await db
            .select({ count: sql<number>`count(*)` })
            .from(bibleVerses)
            .where(eq(bibleVerses.chapterId, capitulo.id))) as any[];

          const beforeCount = Number(countResult.count);

          const versiculos = capituloData.versiculos.map((vers) => ({
            chapterId: capitulo.id,
            number: vers.versiculo,
            text: vers.texto,
          }));

          console.log(
            `          [+] Inserindo versos (total: ${versiculos.length})...`,
          );

          if (versiculos.length > 0) {
            await db
              .insert(bibleVerses)
              .values(versiculos)
              .onConflictDoNothing();
          }

          const [afterCountResult] = (await db
            .select({ count: sql<number>`count(*)` })
            .from(bibleVerses)
            .where(eq(bibleVerses.chapterId, capitulo.id))) as any[];

          const afterCount = Number(afterCountResult.count);

          const inserted = afterCount - beforeCount;
          createdVerses += inserted;

          console.log(
            `          [✔] Antes: ${beforeCount} Depois: ${afterCount} (+=${inserted})`,
          );
        }
      };

      console.log("\n🚀 Processando Antigo Testamento...");
      await this.addLog("📜 Processando Antigo Testamento...");

      let ordem = 1;
      for (const livro of bible.antigoTestamento) {
        await processLivro(livro, ordem++, "OLD");
      }

      console.log("\n✝️ Processando Novo Testamento...");
      await this.addLog("✝️ Processando Novo Testamento...");

      for (const livro of bible.novoTestamento) {
        await processLivro(livro, ordem++, "NEW");
      }

      this.endTime = new Date();

      console.log("\n🎉 FINALIZADO!");
      console.log("📚 Livros criados:", createdBooks);
      console.log("📄 Capítulos criados:", createdChapters);
      console.log("✍️ Versículos criados:", createdVerses);

      await this.addLog(`🎉 FINALIZADO!`);
      await this.addLog(
        `📊 Livros: ${createdBooks} | Capítulos: ${createdChapters} | Versículos: ${createdVerses}`,
      );

      return res.status(200).json({
        ok: true,
        createdBooks,
        createdChapters,
        createdVerses,
      });
    } catch (err: any) {
      this.hasError = true;
      this.endTime = new Date();

      console.error("💀 ERRO GERAL 💀:", err);
      await this.addLog(`❌ ERRO: ${err.message}`);

      return handleError(err, res, "controller de seed database");
    }
  }
}
