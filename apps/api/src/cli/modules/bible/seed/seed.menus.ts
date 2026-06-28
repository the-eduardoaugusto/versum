import prompts from "prompts";

export const confirmSeedPromptMenu = async () =>
  await prompts({
    type: "confirm",
    name: "confirm",
    message:
      "Deseja prosseguir com o seed da bíblia? Os dados serão buscados do repositório biblia-db.",
    initial: true,
  });

export const seedOptionsPromptMenu = async () =>
  await prompts({
    type: "multiselect",
    name: "options",
    message: "Selecione as opções de seed:",
    choices: [
      { title: "Inserir livros", value: "books", selected: true },
      { title: "Inserir capítulos", value: "chapters", selected: true },
      { title: "Inserir versículos", value: "verses", selected: true },
    ],
  });
