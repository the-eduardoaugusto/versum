package bible

import (
	"context"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/idgen"
)

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

func (s *BibleService) CreateBook(ctx context.Context, b RawBook) (*Book, error) {
	ID := idgen.New()
	book := &Book{
		ID:      ID,
		RawBook: b,
	}

	return s.books.CreateBook(ctx, book)
}

func (s *BibleService) FindBooksPaginated(ctx context.Context, limit, page int) ([]*Book, int, error) {
	l := min(max(limit, 1), 50)
	p := max(page, 1)

	return s.books.FindBooksPaginated(ctx, l, p)
}

func (s *BibleService) FindBookByDynamicID(ctx context.Context, dynamicID string) (*Book, error) {
	return s.books.FindBookByDynamicID(ctx, dynamicID)
}

func (s *BibleService) CreateChapter(ctx context.Context, c RawChapter) (*Chapter, error) {
	ID := idgen.New()
	chapter := &Chapter{
		ID:         ID,
		RawChapter: c,
	}

	return s.chapters.CreateChapter(ctx, chapter)
}

func (s *BibleService) FindChaptersPaginatedByBookDynamicID(ctx context.Context, bookDynamicID string, limit, page int) ([]*Chapter, int, error) {
	l := min(max(limit, 1), 50)
	p := max(page, 1)
	return s.chapters.FindChaptersPaginatedByBookDynamicID(ctx, bookDynamicID, l, p)
}

func (s *BibleService) FindChapterByNumberAndBookDynamicID(ctx context.Context, chapterNumber int, bookDynamicID string) (*Chapter, error) {
	return s.chapters.FindChapterByNumberAndBookDynamicID(ctx, chapterNumber, bookDynamicID)
}

func (s *BibleService) CreateVerse(ctx context.Context, v RawVerse) (*Verse, error) {
	ID := idgen.New()
	verse := &Verse{
		ID:       ID,
		RawVerse: v,
	}

	return s.verses.CreateVerse(ctx, verse)
}

func (s *BibleService) CreateVerses(ctx context.Context, v []RawVerse) ([]*Verse, int, error) {
	verses := make([]*Verse, 0, len(v))
	for _, rawVerse := range v {
		ID := idgen.New()
		verse := &Verse{
			ID:       ID,
			RawVerse: rawVerse,
		}

		verses = append(verses, verse)
	}

	return s.verses.CreateVerses(ctx, verses)
}

func (s *BibleService) FindVersesPaginatedByChapterNumberAndBookDynamicID(ctx context.Context, bookDynamicID string, chapterNumber, limit, page int) ([]*Verse, int, error) {
	l := min(max(limit, 1), 50)
	p := max(page, 1)
	return s.verses.FindVersesPaginatedByChapterNumberAndBookDynamicID(ctx, bookDynamicID, chapterNumber, l, p)
}

func (s *BibleService) FindVerseByChapterNumberAndBookDynamicIDAndVerseNumber(ctx context.Context, bookDynamicID string, chapterNumber, verseNumber int) (*Verse, error) {
	return s.verses.FindVerseByChapterNumberAndBookDynamicIDAndVerseNumber(ctx, bookDynamicID, chapterNumber, verseNumber)
}
