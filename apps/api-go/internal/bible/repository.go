package bible

import "context"

// BookRepository defines how to fetch Book data, independent of storage.
// Any type implementing these two methods satisfies this interface automatically.
type BookRepository interface {
	// FindBooksPaginated returns a page of books ordered by their canonical order,
	// along with the total number of books available (ignoring pagination).
	FindBooksPaginated(ctx context.Context, limit, page int) ([]*Book, int, error)

	// FindBookByDynamicID looks up a single book by its slug or name.
	// It returns ErrBookNotFound if no book matches.
	FindBookByDynamicID(ctx context.Context, dynamicID string) (*Book, error)
	CreateBook(ctx context.Context, b *Book) (*Book, error)
}

// ChapterRepository defines how to fetch Chapter data, independent of storage.
type ChapterRepository interface {
	// FindChaptersPaginatedByBookDynamicID returns a page of chapters belonging to
	// the book identified by bookDynamicID (its slug or name), along with the total
	// number of chapters in that book (ignoring pagination).
	FindChaptersPaginatedByBookDynamicID(ctx context.Context, bookDynamicID string, limit, page int) ([]*Chapter, int, error)

	// FindChapterByNumberAndBookDynamicID looks up a single chapter by its number,
	// within the book identified by bookDynamicID (its slug or name).
	FindChapterByNumberAndBookDynamicID(ctx context.Context, chapterNumber int, bookDynamicID string) (*Chapter, error)
	CreateChapter(ctx context.Context, c *Chapter) (*Chapter, error)
}

// VerseRepository defines how to fetch Verse data, independent of storage.
type VerseRepository interface {
	// FindVersesPaginatedByChapterNumberAndBookDynamicID returns a page of verses
	// belonging to the given chapter number, within the book identified by
	// bookDynamicID (its slug or name), along with the total number of verses in
	// that chapter (ignoring pagination).
	FindVersesPaginatedByChapterNumberAndBookDynamicID(ctx context.Context, bookDynamicID string, chapterNumber, limit, page int) ([]*Verse, int, error)

	// FindVerseByChapterNumberAndBookDynamicIDAndVerseNumber looks up a single verse
	// by its number, within the chapter and book identified by chapterNumber and
	// bookDynamicID (the book's slug or name).
	FindVerseByChapterNumberAndBookDynamicIDAndVerseNumber(ctx context.Context, bookDynamicID string, chapterNumber, verseNumber int) (*Verse, error)
	CreateVerse(ctx context.Context, v *Verse) (*Verse, error)
	CreateVerses(ctx context.Context, verses []*Verse) ([]*Verse, int, error)
}
