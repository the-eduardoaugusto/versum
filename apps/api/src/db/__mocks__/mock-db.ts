import { BibleBook, BibleChapter, BibleVerse } from "@/repositories";
import mockBibleDbJson from "./bible-db.json";

type MockBibleDb = {
  books: BibleBook[];
  chapters: BibleChapter[];
  verses: BibleVerse[];
};

export const mockBibleDb = mockBibleDbJson as unknown as MockBibleDb;
