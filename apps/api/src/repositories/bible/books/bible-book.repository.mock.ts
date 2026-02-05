import { BibleBook, BibleChapter, Testament } from "@/libs/prisma";
import { BibleBookRepository } from "./bible-book.repository";

// Dados de exemplo para os testes
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
    id: "uuid6",
    name: "Josué",
    order: 6,
    testament: "OLD",
    totalChapters: 24,
  },
  {
    id: "uuid7",
    name: "Juízes",
    order: 7,
    testament: "OLD",
    totalChapters: 21,
  },
  {
    id: "uuid8",
    name: "Rute",
    order: 8,
    testament: "OLD",
    totalChapters: 4,
  },
  {
    id: "uuid9",
    name: "1 Samuel",
    order: 9,
    testament: "OLD",
    totalChapters: 31,
  },
  {
    id: "uuid10",
    name: "2 Samuel",
    order: 10,
    testament: "OLD",
    totalChapters: 24,
  },
  {
    id: "uuid11",
    name: "1 Reis",
    order: 11,
    testament: "OLD",
    totalChapters: 22,
  },
  {
    id: "uuid12",
    name: "2 Reis",
    order: 12,
    testament: "OLD",
    totalChapters: 25,
  },
  {
    id: "uuid13",
    name: "1 Crônicas",
    order: 13,
    testament: "OLD",
    totalChapters: 29,
  },
  {
    id: "uuid14",
    name: "2 Crônicas",
    order: 14,
    testament: "OLD",
    totalChapters: 36,
  },
  {
    id: "uuid15",
    name: "Esdras",
    order: 15,
    testament: "OLD",
    totalChapters: 10,
  },
  {
    id: "uuid16",
    name: "Neemias",
    order: 16,
    testament: "OLD",
    totalChapters: 13,
  },
  {
    id: "uuid17",
    name: "Ester",
    order: 17,
    testament: "OLD",
    totalChapters: 10,
  },
  {
    id: "uuid18",
    name: "Jó",
    order: 18,
    testament: "OLD",
    totalChapters: 42,
  },
  {
    id: "uuid19",
    name: "Salmos",
    order: 19,
    testament: "OLD",
    totalChapters: 150,
  },
  {
    id: "uuid20",
    name: "Provérbios",
    order: 20,
    testament: "OLD",
    totalChapters: 31,
  },
  {
    id: "uuid21",
    name: "Eclesiastes",
    order: 21,
    testament: "OLD",
    totalChapters: 12,
  },
  {
    id: "uuid22",
    name: "Cânticos",
    order: 22,
    testament: "OLD",
    totalChapters: 8,
  },
  {
    id: "uuid23",
    name: "Isaías",
    order: 23,
    testament: "OLD",
    totalChapters: 66,
  },
  {
    id: "uuid24",
    name: "Jeremias",
    order: 24,
    testament: "OLD",
    totalChapters: 52,
  },
  {
    id: "uuid25",
    name: "Lamentações",
    order: 25,
    testament: "OLD",
    totalChapters: 5,
  },
  {
    id: "uuid26",
    name: "Ezequiel",
    order: 26,
    testament: "OLD",
    totalChapters: 48,
  },
  {
    id: "uuid27",
    name: "Daniel",
    order: 27,
    testament: "OLD",
    totalChapters: 12,
  },
  {
    id: "uuid28",
    name: "Oséias",
    order: 28,
    testament: "OLD",
    totalChapters: 14,
  },
  {
    id: "uuid29",
    name: "Joel",
    order: 29,
    testament: "OLD",
    totalChapters: 3,
  },
  {
    id: "uuid30",
    name: "Amós",
    order: 30,
    testament: "OLD",
    totalChapters: 9,
  },
  {
    id: "uuid31",
    name: "Obadias",
    order: 31,
    testament: "OLD",
    totalChapters: 1,
  },
  {
    id: "uuid32",
    name: "Jonas",
    order: 32,
    testament: "OLD",
    totalChapters: 4,
  },
  {
    id: "uuid33",
    name: "Miquéias",
    order: 33,
    testament: "OLD",
    totalChapters: 7,
  },
  {
    id: "uuid34",
    name: "Naum",
    order: 34,
    testament: "OLD",
    totalChapters: 3,
  },
  {
    id: "uuid35",
    name: "Habacuque",
    order: 35,
    testament: "OLD",
    totalChapters: 3,
  },
  {
    id: "uuid36",
    name: "Sofonias",
    order: 36,
    testament: "OLD",
    totalChapters: 3,
  },
  {
    id: "uuid37",
    name: "Ageu",
    order: 37,
    testament: "OLD",
    totalChapters: 2,
  },
  {
    id: "uuid38",
    name: "Zacarias",
    order: 38,
    testament: "OLD",
    totalChapters: 14,
  },
  {
    id: "uuid39",
    name: "Malaquias",
    order: 39,
    testament: "OLD",
    totalChapters: 4,
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
  {
    id: "uuid44",
    name: "Atos",
    order: 44,
    testament: "NEW",
    totalChapters: 28,
  },
  {
    id: "uuid45",
    name: "Romanos",
    order: 45,
    testament: "NEW",
    totalChapters: 16,
  },
  {
    id: "uuid46",
    name: "1 Coríntios",
    order: 46,
    testament: "NEW",
    totalChapters: 16,
  },
  {
    id: "uuid47",
    name: "2 Coríntios",
    order: 47,
    testament: "NEW",
    totalChapters: 13,
  },
  {
    id: "uuid48",
    name: "Gálatas",
    order: 48,
    testament: "NEW",
    totalChapters: 6,
  },
  {
    id: "uuid49",
    name: "Efésios",
    order: 49,
    testament: "NEW",
    totalChapters: 6,
  },
  {
    id: "uuid50",
    name: "Filipenses",
    order: 50,
    testament: "NEW",
    totalChapters: 4,
  },
  {
    id: "uuid51",
    name: "Colossenses",
    order: 51,
    testament: "NEW",
    totalChapters: 4,
  },
  {
    id: "uuid52",
    name: "1 Tessalonicenses",
    order: 52,
    testament: "NEW",
    totalChapters: 5,
  },
  {
    id: "uuid53",
    name: "2 Tessalonicenses",
    order: 53,
    testament: "NEW",
    totalChapters: 3,
  },
  {
    id: "uuid54",
    name: "1 Timóteo",
    order: 54,
    testament: "NEW",
    totalChapters: 6,
  },
  {
    id: "uuid55",
    name: "2 Timóteo",
    order: 55,
    testament: "NEW",
    totalChapters: 4,
  },
  {
    id: "uuid56",
    name: "Tito",
    order: 56,
    testament: "NEW",
    totalChapters: 3,
  },
  {
    id: "uuid57",
    name: "Filemom",
    order: 57,
    testament: "NEW",
    totalChapters: 1,
  },
  {
    id: "uuid58",
    name: "Hebreus",
    order: 58,
    testament: "NEW",
    totalChapters: 13,
  },
  {
    id: "uuid59",
    name: "Tiago",
    order: 59,
    testament: "NEW",
    totalChapters: 5,
  },
  {
    id: "uuid60",
    name: "1 Pedro",
    order: 60,
    testament: "NEW",
    totalChapters: 5,
  },
  {
    id: "uuid61",
    name: "2 Pedro",
    order: 61,
    testament: "NEW",
    totalChapters: 3,
  },
  {
    id: "uuid62",
    name: "1 João",
    order: 62,
    testament: "NEW",
    totalChapters: 5,
  },
  {
    id: "uuid63",
    name: "2 João",
    order: 63,
    testament: "NEW",
    totalChapters: 1,
  },
  {
    id: "uuid64",
    name: "3 João",
    order: 64,
    testament: "NEW",
    totalChapters: 1,
  },
  {
    id: "uuid65",
    name: "Judas",
    order: 65,
    testament: "NEW",
    totalChapters: 1,
  },
  {
    id: "uuid66",
    name: "Apocalipse",
    order: 66,
    testament: "NEW",
    totalChapters: 22,
  },
];

const mockChapter: BibleChapter = {
  bookId: "uuid1",
  id: "uuid2",
  number: 1,
  totalVerses: 15,
};

// Mock do repositório BibleBook com implementações completas
const repo: Partial<BibleBookRepository> = {
  // Métodos da BaseRepository
  async create(data) {
    // Simula a criação de um novo livro
    const newBook: BibleBook = {
      id: `uuid${mockBooks.length + 1}`,
      name: (data as any).name || `Livro ${mockBooks.length + 1}`,
      order: (data as any).order || mockBooks.length + 1,
      testament: (data as any).testament || "OLD",
      totalChapters: (data as any).totalChapters || 1,
    };

    // Adiciona ao array de livros
    mockBooks.push(newBook);
    return newBook;
  },

  async findById(id: string) {
    return mockBooks.find((book) => book.id === id) || null;
  },

  async findMany(args?: {
    where?: { testament?: Testament; order?: number };
    skip?: number;
    take?: number;
    orderBy?: { order: "asc" | "desc" };
  }) {
    let filteredBooks = [...mockBooks];

    // Aplica filtros
    if (args?.where) {
      if (args.where.testament) {
        filteredBooks = filteredBooks.filter(
          (book) => book.testament === args.where?.testament,
        );
      }
      if (args.where.order) {
        filteredBooks = filteredBooks.filter(
          (book) => book.order === args.where?.order,
        );
      }
    }

    // Aplica ordenação
    if (args?.orderBy?.order === "asc") {
      filteredBooks.sort((a, b) => a.order - b.order);
    } else if (args?.orderBy?.order === "desc") {
      filteredBooks.sort((a, b) => b.order - a.order);
    }

    // Aplica paginação
    if (args?.skip) {
      filteredBooks = filteredBooks.slice(args.skip);
    }
    if (args?.take) {
      filteredBooks = filteredBooks.slice(0, args.take);
    }

    return filteredBooks;
  },

  async update(id: string, data) {
    const index = mockBooks.findIndex((book) => book.id === id);
    if (index === -1) {
      throw new Error(`Livro com ID ${id} não encontrado`);
    }

    const updatedBook = {
      ...mockBooks[index],
      ...(data as Partial<BibleBook>),
    };

    mockBooks[index] = updatedBook;
    return updatedBook;
  },

  async delete(id: string) {
    const index = mockBooks.findIndex((book) => book.id === id);
    if (index === -1) {
      throw new Error(`Livro com ID ${id} não encontrado`);
    }

    const deletedBook = mockBooks.splice(index, 1)[0];
    return deletedBook;
  },

  async count(args?: { where?: { testament?: Testament } }) {
    let countableBooks = [...mockBooks];

    if (args?.where?.testament) {
      countableBooks = countableBooks.filter(
        (book) => book.testament === args.where?.testament,
      );
    }

    return countableBooks.length;
  },

  // Métodos específicos de BibleBookRepository
  async findByName({ bookName }: { bookName: string }) {
    return mockBooks.find((book) => book.name === bookName) || null;
  },

  async findByOrder({ bookOrder }: { bookOrder: number }) {
    return mockBooks.find((book) => book.order === bookOrder) || null;
  },

  async findByTestament({
    testament,
    args,
  }: {
    testament: Testament;
    args?: { skip?: number; take?: number };
  }) {
    let filteredBooks = mockBooks.filter(
      (book) => book.testament === testament,
    );

    // Aplica paginação se fornecida
    if (args?.skip !== undefined) {
      filteredBooks = filteredBooks.slice(args.skip);
    }
    if (args?.take !== undefined) {
      filteredBooks = filteredBooks.slice(0, args.take);
    }

    return filteredBooks;
  },

  async findWithChapters({ bookId }: { bookId: string }) {
    const book = mockBooks.find((book) => book.id === bookId);
    if (!book) return null;

    return {
      ...book,
      chapters: [mockChapter], // Retorna capítulos simulados
    };
  },

  async findAllOrderedByOrder(args?: { skip?: number; take?: number }) {
    let orderedBooks = [...mockBooks].sort((a, b) => a.order - b.order);

    // Aplica paginação se fornecida
    if (args?.skip !== undefined) {
      orderedBooks = orderedBooks.slice(args.skip);
    }
    if (args?.take !== undefined) {
      orderedBooks = orderedBooks.slice(0, args.take);
    }

    return orderedBooks;
  },
};

export const bibleBookRepoMock = Object.freeze(repo) as BibleBookRepository;
