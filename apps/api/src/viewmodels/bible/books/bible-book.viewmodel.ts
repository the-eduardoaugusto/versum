import { BibleBook } from "@/repositories";
import { Testament } from "@/services/bible/books/bible-books.service";
import { BaseViewModel } from "../../api-response.viewmodel";

export class BibleBookViewModel extends BaseViewModel<Omit<BibleBook, never>> {
  id: string;
  name: string;
  order: number;
  testament: Testament;
  totalChapters: number;

  constructor(book: BibleBook) {
    super(book);
    this.id = book.id;
    this.name = book.name;
    this.order = book.order;
    this.testament = book.testament;
    this.totalChapters = book.totalChapters;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      order: this.order,
      testament: this.testament,
      totalChapters: this.totalChapters,
    };
  }
}
