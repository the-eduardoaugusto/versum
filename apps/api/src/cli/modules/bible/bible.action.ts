import { logger } from "@versum/logger";
import prompts from "prompts";
import { initCli } from "../../index";
import { type SeedBibleOptions, seedBibleFromRemote } from "./seed/seed.action";
import { confirmSeedPromptMenu, seedOptionsPromptMenu } from "./seed/seed.menus";

export const bibleMenu = async () =>
  await prompts({
    type: "select",
    name: "bible",
    message: "Escolha uma opção:",
    choices: [
      { title: "Seed (inserir no banco)", value: "seed" },
      { title: "Voltar", value: "back" },
    ],
  });

export async function bibleAction() {
  const menuResult = await bibleMenu();

  switch (menuResult.bible) {
    case "seed": {
      const { confirm } = await confirmSeedPromptMenu();

      if (!confirm) {
        logger("info", "Seed cancelado.");
        return await bibleAction();
      }

      const { options } = await seedOptionsPromptMenu();

      const seedOptions: SeedBibleOptions = {
        insertBooks: options.includes("books"),
        insertChapters: options.includes("chapters"),
        insertVerses: options.includes("verses"),
      };

      await seedBibleFromRemote(seedOptions);

      logger("info", "Pressione Enter para continuar...");
      await prompts({ type: "text", name: "continue", message: "" });

      return await bibleAction();
    }

    case "back":
      console.clear();
      logger(
        { color: "blue", icon: "", level: "info" },
        "Voltando para o menu...",
      );
      await initCli(false);
      return;
  }
}
