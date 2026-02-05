import { BibleChapter, BibleVerse, BibleBook, Testament } from "@/libs/prisma";
import { BibleChapterRepository } from "./bible-chapter.repository";

// Importar os dados de livros do mock existente para consistência
const mockBooks: BibleBook[] = [
  {
    id: "uuid1",
    name: "Gênesis",
    order: 1,
    testament: "OLD",
    totalChapters: 50,
  },
  {
    id: "uuid2",
    name: "Êxodo",
    order: 2,
    testament: "OLD",
    totalChapters: 40,
  },
  {
    id: "uuid3",
    name: "Levítico",
    order: 3,
    testament: "OLD",
    totalChapters: 27,
  },
  {
    id: "uuid4",
    name: "Números",
    order: 4,
    testament: "OLD",
    totalChapters: 36,
  },
  {
    id: "uuid5",
    name: "Deuteronômio",
    order: 5,
    testament: "OLD",
    totalChapters: 34,
  },
  {
    id: "uuid40",
    name: "Mateus",
    order: 40,
    testament: "NEW",
    totalChapters: 28,
  },
  {
    id: "uuid41",
    name: "Marcos",
    order: 41,
    testament: "NEW",
    totalChapters: 16,
  },
  {
    id: "uuid42",
    name: "Lucas",
    order: 42,
    testament: "NEW",
    totalChapters: 24,
  },
  {
    id: "uuid43",
    name: "João",
    order: 43,
    testament: "NEW",
    totalChapters: 21,
  },
];

// Gerar capítulos de exemplo para os livros
const mockChapters: BibleChapter[] = [];
for (const book of mockBooks) {
  for (let i = 1; i <= book.totalChapters; i++) {
    mockChapters.push({
      id: `chapter-${book.id}-${i}`,
      bookId: book.id,
      number: i,
      totalVerses: Math.floor(Math.random() * 30) + 10, // Entre 10 e 39 versículos
    });
  }
}

// Mock do repositório BibleChapter com implementações completas
const repo: Partial<BibleChapterRepository> = {
  // Métodos da BaseRepository
  async create(data) {
    const newChapter: BibleChapter = {
      id: `chapter-${Date.now()}`,
      bookId: (data as any).bookId,
      number: (data as any).number,
      totalVerses: (data as any).totalVerses || 10,
    };
    mockChapters.push(newChapter);
    return newChapter;
  },

  async findById(id: string) {
    return mockChapters.find((chapter) => chapter.id === id) || null;
  },

  async findMany(args?: {
    where?: { bookId?: string };
    skip?: number;
    take?: number;
    orderBy?: { number: "asc" | "desc" };
  }) {
    let filteredChapters = [...mockChapters];

    // Aplica filtros
    if (args?.where?.bookId) {
      filteredChapters = filteredChapters.filter(
        (chapter) => chapter.bookId === args.where?.bookId,
      );
    }

    // Aplica ordenação
    if (args?.orderBy?.number === "asc") {
      filteredChapters.sort((a, b) => a.number - b.number);
    } else if (args?.orderBy?.number === "desc") {
      filteredChapters.sort((a, b) => b.number - a.number);
    }

    // Aplica paginação
    if (args?.skip) {
      filteredChapters = filteredChapters.slice(args.skip);
    }
    if (args?.take) {
      filteredChapters = filteredChapters.slice(0, args.take);
    }

    return filteredChapters;
  },

  async update(id: string, data) {
    const index = mockChapters.findIndex((chapter) => chapter.id === id);
    if (index === -1) {
      throw new Error(`Capítulo com ID ${id} não encontrado`);
    }

    const updatedChapter = {
      ...mockChapters[index],
      ...(data as Partial<BibleChapter>),
    };

    mockChapters[index] = updatedChapter;
    return updatedChapter;
  },

  async delete(id: string) {
    const index = mockChapters.findIndex((chapter) => chapter.id === id);
    if (index === -1) {
      throw new Error(`Capítulo com ID ${id} não encontrado`);
    }

    const deletedChapter = mockChapters.splice(index, 1)[0];
    return deletedChapter;
  },

  async count(args?: { where?: { bookId?: string } }) {
    let countableChapters = [...mockChapters];

    if (args?.where?.bookId) {
      countableChapters = countableChapters.filter(
        (chapter) => chapter.bookId === args.where?.bookId,
      );
    }

    return countableChapters.length;
  },

  // Métodos específicos de BibleChapterRepository
  async findByBookAndNumber({ bookOrder, chapterNumber }) {
    const book = mockBooks.find((b) => b.order === bookOrder);
    if (!book) return null;

    return (
      mockChapters.find(
        (c) => c.bookId === book.id && c.number === chapterNumber,
      ) || null
    );
  },

  async findByBookId({ bookId, args }) {
    let filteredChapters = mockChapters.filter(
      (chapter) => chapter.bookId === bookId,
    );

    // Aplica ordenação
    filteredChapters.sort((a, b) => a.number - b.number);

    // Aplica paginação se fornecida
    if (args?.skip !== undefined) {
      filteredChapters = filteredChapters.slice(args.skip);
    }
    if (args?.take !== undefined) {
      filteredChapters = filteredChapters.slice(0, args.take);
    }

    return filteredChapters;
  },

  async findWithVerses({ chapterId }) {
    const chapter = mockChapters.find((c) => c.id === chapterId);
    if (!chapter) return null;

    // Simula versículos para o capítulo
    const verses = [];
    for (let i = 1; i <= chapter.totalVerses; i++) {
      verses.push({
        id: `verse-${chapterId}-${i}`,
        chapterId: chapter.id,
        number: i,
        text: `Texto do versículo ${i} do capítulo ${chapter.number} de ${mockBooks.find((b) => b.id === chapter.bookId)?.name}`,
      });
    }

    return {
      ...chapter,
      verses,
    };
  },
};

export const bibleChapterRepoMock = Object.freeze(
  repo,
) as BibleChapterRepository;
