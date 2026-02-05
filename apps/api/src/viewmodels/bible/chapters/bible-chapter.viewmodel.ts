import { BibleChapter } from "@/libs/prisma/index";
import { BaseViewModel } from "../../api-response.viewmodel";

export class BibleChapterViewModel extends BaseViewModel<
  Omit<BibleChapter, never>
> {
  id: string;
  bookId: string;
  number: number;
  totalVerses: number;

  constructor(chapter: BibleChapter) {
    super(chapter);
    this.id = chapter.id;
    this.bookId = chapter.bookId;
    this.number = chapter.number;
    this.totalVerses = chapter.totalVerses;
  }

  toJSON() {
    return {
      id: this.id,
      bookId: this.bookId,
      number: this.number,
      totalVerses: this.totalVerses,
    };
  }
}
