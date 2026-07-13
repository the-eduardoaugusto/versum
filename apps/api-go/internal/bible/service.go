package bible

import "context"

type BibleService struct {
	books    BookRepository
	chapters ChapterRepository
	verses   VerseRepository
}

func NewBibleService(books BookRepository, chapters ChapterRepository, verses VerseRepository) *BibleService {
	return &BibleService{
		books:    books,
		chapters: chapters,
		verses:   verses,
	}
}

func (s *BibleService) FindBooksPaginated(ctx context.Context, limit, page int) ([]*Book, int, error) {
	l := min(max(limit, 1), 50)
	p := max(page, 1)

	return s.books.FindBooksPaginated(ctx, l, p)
}

func (s *BibleService) FindBookByDynamicID(ctx context.Context, dynamicID string) (*Book, error) {
	return s.books.FindBookByDynamicID(ctx, dynamicID)
}

func (s *BibleService) FindChaptersPaginatedByBookDynamicID(ctx context.Context, bookDynamicID string, limit, page int) ([]*Chapter, int, error) {
	l := min(max(limit, 1), 50)
	p := max(page, 1)
	return s.chapters.FindChaptersPaginatedByBookDynamicID(ctx, bookDynamicID, l, p)
}

func (s *BibleService) FindChapterByNumberAndBookDynamicID(ctx context.Context, chapterNumber int, bookDynamicID string) (*Chapter, error) {
	return s.chapters.FindChapterByNumberAndBookDynamicID(ctx, chapterNumber, bookDynamicID)
}

func (s *BibleService) FindVersesPaginatedByChapterNumberAndBookDynamicID(ctx context.Context, bookDynamicID string, chapterNumber, limit, page int) ([]*Verse, int, error) {
	l := min(max(limit, 1), 50)
	p := max(page, 1)
	return s.verses.FindVersesPaginatedByChapterNumberAndBookDynamicID(ctx, bookDynamicID, chapterNumber, l, p)
}

func (s *BibleService) FindVerseByChapterNumberAndBookDynamicIDAndVerseNumber(ctx context.Context, bookDynamicID string, chapterNumber, verseNumber int) (*Verse, error) {
	return s.verses.FindVerseByChapterNumberAndBookDynamicIDAndVerseNumber(ctx, bookDynamicID, chapterNumber, verseNumber)
}
