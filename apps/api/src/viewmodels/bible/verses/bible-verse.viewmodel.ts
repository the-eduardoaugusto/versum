import { BibleVerse } from "@/repositories";
import { BaseViewModel } from "../../api-response.viewmodel";

export class BibleVerseViewModel extends BaseViewModel<
  Omit<BibleVerse, never>
> {
  id: string;
  chapterId: string;
  number: number;
  text: string;

  constructor(verse: BibleVerse) {
    super(verse);
    this.id = verse.id;
    this.chapterId = verse.chapterId;
    this.number = verse.number;
    this.text = verse.text;
  }

  toJSON() {
    return {
      id: this.id,
      chapterId: this.chapterId,
      number: this.number,
      text: this.text,
    };
  }
}
