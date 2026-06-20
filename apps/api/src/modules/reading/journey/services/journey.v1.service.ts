import { logger } from "@versum/logger";
import { ConflictError, NotFoundError } from "@/utils/app/errors/index.ts";
import { db } from "../../../../infrastructure/db/index.ts";
import {
  type ChapterWithContent,
  JourneyRepositoryV1,
} from "../repositories/journey.v1.repository.ts";

export interface ChapterWithContentResponse {
  chapter: {
    id: string;
    number: number;
    totalVerses: number;
  };
  book: {
    id: string;
    order: number;
    name: string;
    slug: string;
  };
  verses: {
    id: string;
    number: number;
    text: string;
  }[];
}

export interface JourneyProgress {
  chaptersRead: number;
  chaptersRemaining: number;
  totalChapters: number;
  percentComplete: number;
  isAtEnd: boolean;
}

export interface FeedResponse {
  current: ChapterWithContentResponse | null;
  nextItems: ChapterWithContentResponse[];
  progress: JourneyProgress;
}

export interface StatusResponse {
  chaptersRead: number;
  chaptersRemaining: number;
  totalChapters: number;
  percentComplete: number;
  isAtEnd: boolean;
}

export class JourneyServiceV1 {
  private readonly repository: JourneyRepositoryV1;
  private readonly transaction: typeof db.transaction;

  constructor({
    repository,
    transaction,
  }: {
    repository?: JourneyRepositoryV1;
    transaction?: typeof db.transaction;
  } = {}) {
    this.repository = repository ?? new JourneyRepositoryV1();
    this.transaction = transaction ?? db.transaction;
  }

  private mapChapter(result: ChapterWithContent): ChapterWithContentResponse {
    return {
      chapter: {
        id: result.chapter.id,
        number: result.chapter.number,
        totalVerses: result.chapter.totalVerses,
      },
      book: {
        id: result.book.id,
        order: result.book.order,
        name: result.book.name,
        slug: result.book.slug,
      },
      verses: result.verses.map((v) => ({
        id: v.id,
        number: v.number,
        text: v.text,
      })),
    };
  }

  private async calculateProgress(userId: string): Promise<JourneyProgress> {
    const [chaptersRead, totalChapters] = await Promise.all([
      this.repository.getReadChaptersCount(userId),
      this.repository.getTotalChapters(),
    ]);

    const chaptersRemaining = Math.max(0, totalChapters - chaptersRead);
    const percentComplete =
      totalChapters > 0 ? Math.round((chaptersRead / totalChapters) * 100) : 0;

    return {
      chaptersRead,
      chaptersRemaining,
      totalChapters,
      percentComplete,
      isAtEnd: chaptersRemaining === 0,
    };
  }

  async getFeed(userId: string, bufferSize: number = 4): Promise<FeedResponse> {
    const [current, totalChapters] = await Promise.all([
      this.repository.findNextChapterToRead(userId),
      this.repository.getTotalChapters(),
    ]);

    let nextItems: ChapterWithContent[] = [];

    if (current && bufferSize > 0) {
      nextItems = await this.repository.findChaptersAfter(
        current.chapter.id,
        bufferSize,
      );
    }

    const chaptersRead = await this.repository.getReadChaptersCount(userId);
    const chaptersRemaining = Math.max(0, totalChapters - chaptersRead);
    const isAtEnd = chaptersRemaining === 0;

    const progress: JourneyProgress = {
      chaptersRead,
      chaptersRemaining,
      totalChapters,
      percentComplete:
        totalChapters > 0
          ? Math.round((chaptersRead / totalChapters) * 100)
          : 0,
      isAtEnd,
    };

    return {
      current: current ? this.mapChapter(current) : null,
      nextItems: nextItems.map((c) => this.mapChapter(c)),
      progress,
    };
  }

  async markCurrentAsRead(
    userId: string,
    chapterId: string,
  ): Promise<{ success: boolean }> {
    return this.transaction(async (tx) => {
      const chapterExists = await this.repository.findChapterById(
        chapterId,
        tx as any,
      );
      if (!chapterExists) {
        throw new NotFoundError("Chapter not found");
      }

      const alreadyRead = await this.repository.isChapterRead(
        userId,
        chapterId,
        tx as any,
      );
      if (alreadyRead) {
        logger(
          "debug",
          `[Journey] Chapter already read, idempotent no-op: ${chapterId}`,
        );
        return { success: true };
      }

      const expectedChapter = await this.repository.findNextChapterToRead(
        userId,
        tx as any,
      );
      if (!expectedChapter || expectedChapter.chapter.id !== chapterId) {
        throw new ConflictError(
          "Chapter does not match expected current chapter",
        );
      }

      await this.repository.markChapterAsRead({ userId, chapterId }, tx as any);

      logger("debug", `[Journey] Marked chapter as read: ${chapterId}`);
      return { success: true };
    });
  }

  async getStatus(userId: string): Promise<StatusResponse> {
    const progress = await this.calculateProgress(userId);

    return {
      chaptersRead: progress.chaptersRead,
      chaptersRemaining: progress.chaptersRemaining,
      totalChapters: progress.totalChapters,
      percentComplete: progress.percentComplete,
      isAtEnd: progress.isAtEnd,
    };
  }
}
