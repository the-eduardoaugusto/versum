import { BibleVerse, BibleChapter } from "@/libs/prisma";
import { BibleVerseRepository } from "./bible-verse.repository";

// Gerar versículos de exemplo com base nos capítulos existentes
const mockVerses: BibleVerse[] = [];

// Função auxiliar para gerar versículos de exemplo
function generateSampleVerses() {
  // Para fins de teste, vamos criar alguns versículos de exemplo
  // Na prática, estes seriam gerados com base nos capítulos existentes
  for (let i = 1; i <= 100; i++) {
    mockVerses.push({
      id: `verse-${i}`,
      chapterId: `chapter-${Math.floor(i / 10) + 1}-${i % 10 || 10}`, // Exemplo de ID de capítulo
      number: i % 20 || 1, // Número do versículo (1-20)
      text: `Texto do versículo ${i % 20 || 1} do capítulo ${i % 10 || 10}.`,
    });
  }
}

// Executa a geração de versículos de exemplo
generateSampleVerses();

// Mock do repositório BibleVerse com implementações completas
const repo: Partial<BibleVerseRepository> = {
  // Métodos da BaseRepository
  async create(data) {
    const newVerse: BibleVerse = {
      id: `verse-${Date.now()}`,
      chapterId: (data as any).chapterId,
      number: (data as any).number,
      text: (data as any).text || `Texto do versículo gerado`,
    };
    mockVerses.push(newVerse);
    return newVerse;
  },

  async findById(id: string) {
    return mockVerses.find((verse) => verse.id === id) || null;
  },

  async findMany(args?: {
    where?: { chapterId?: string };
    skip?: number;
    take?: number;
    orderBy?: { number: "asc" | "desc" };
  }) {
    let filteredVerses = [...mockVerses];

    // Aplica filtros
    if (args?.where?.chapterId) {
      filteredVerses = filteredVerses.filter(
        (verse) => verse.chapterId === args.where?.chapterId,
      );
    }

    // Aplica ordenação
    if (args?.orderBy?.number === "asc") {
      filteredVerses.sort((a, b) => a.number - b.number);
    } else if (args?.orderBy?.number === "desc") {
      filteredVerses.sort((a, b) => b.number - a.number);
    }

    // Aplica paginação
    if (args?.skip) {
      filteredVerses = filteredVerses.slice(args.skip);
    }
    if (args?.take) {
      filteredVerses = filteredVerses.slice(0, args.take);
    }

    return filteredVerses;
  },

  async update(id: string, data) {
    const index = mockVerses.findIndex((verse) => verse.id === id);
    if (index === -1) {
      throw new Error(`Versículo com ID ${id} não encontrado`);
    }

    const updatedVerse = {
      ...mockVerses[index],
      ...(data as Partial<BibleVerse>),
    };

    mockVerses[index] = updatedVerse;
    return updatedVerse;
  },

  async delete(id: string) {
    const index = mockVerses.findIndex((verse) => verse.id === id);
    if (index === -1) {
      throw new Error(`Versículo com ID ${id} não encontrado`);
    }

    const deletedVerse = mockVerses.splice(index, 1)[0];
    return deletedVerse;
  },

  async count(args?: { where?: { chapterId?: string } }) {
    let countableVerses = [...mockVerses];

    if (args?.where?.chapterId) {
      countableVerses = countableVerses.filter(
        (verse) => verse.chapterId === args.where?.chapterId,
      );
    }

    return countableVerses.length;
  },

  // Métodos específicos de BibleVerseRepository
  async findByChapterAndNumber({ chapterId, verseNumber }) {
    return (
      mockVerses.find(
        (v) => v.chapterId === chapterId && v.number === verseNumber,
      ) || null
    );
  },

  async findByChapterId({ chapterId }, args) {
    let filteredVerses = mockVerses.filter(
      (verse) => verse.chapterId === chapterId,
    );

    // Aplica ordenação
    filteredVerses.sort((a, b) => a.number - b.number);

    // Aplica paginação se fornecida
    if (args?.skip !== undefined) {
      filteredVerses = filteredVerses.slice(args.skip);
    }
    if (args?.take !== undefined) {
      filteredVerses = filteredVerses.slice(0, args.take);
    }

    return filteredVerses;
  },

  async findWithRelations({ verseId }) {
    const verse = mockVerses.find((v) => v.id === verseId);
    if (!verse) return null;

    // Simula relações para o versículo
    return {
      ...verse,
      likes: [],
      marks: [],
      readings: [],
    };
  },
};

export const bibleVerseRepoMock = Object.freeze(repo) as BibleVerseRepository;
