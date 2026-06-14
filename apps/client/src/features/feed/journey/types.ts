export interface VerseData {
  id: string;
  number: number;
  text: string;
}

export interface VersePage {
  startVerse: number;
  endVerse: number;
  verses: VerseData[];
}

export interface FeedChapter {
  id: string;
  bookName: string;
  bookSlug: string;
  chapterNumber: number;
  totalVerses: number;
  verses: VerseData[];
  pages?: VersePage[];
}

export interface FeedProgress {
  chaptersRead: number;
  chaptersRemaining: number;
  totalChapters: number;
  percentComplete: number;
  isAtEnd: boolean;
}
