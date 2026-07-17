package bible

import (
	"context"
	"errors"
	"fmt"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ChapterRepository struct {
	pool  *pgxpool.Pool
	books bible.BookRepository
}

func NewChapterRepository(pool *pgxpool.Pool, books bible.BookRepository) *ChapterRepository {
	return &ChapterRepository{
		pool:  pool,
		books: books,
	}
}

const (
	findChaptersPaginatedByBookDynamicIDQuery = `SELECT id, book_id, "number" FROM bible_chapters WHERE book_id = $1 ORDER BY "number" LIMIT $2 OFFSET $3;`

	countChaptersQuery = `SELECT count(*) FROM bible_chapters WHERE book_id = $1;`

	findChapterByNumberAndBookDynamicIDQuery = `SELECT id, book_id, "number" FROM bible_chapters WHERE number = $1 AND book_id = $2;`

	createChapterQuery = `INSERT INTO bible_chapters (id, book_id, "number")
		VALUES ($1, $2, $3)
		ON CONFLICT (book_id, "number") DO NOTHING
		RETURNING id, book_id, "number";`
)

func (r *ChapterRepository) FindChaptersPaginatedByBookDynamicID(ctx context.Context, bookDynamicID string, limit, page int) ([]*bible.Chapter, int, error) {
	book, err := r.books.FindBookByDynamicID(ctx, bookDynamicID)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.pool.Query(ctx, findChaptersPaginatedByBookDynamicIDQuery, book.ID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("querying paginated chapters: %w", err)
	}
	defer rows.Close()

	var chapters []*bible.Chapter
	for rows.Next() {
		c := &bible.Chapter{}
		if err := rows.Scan(&c.ID, &c.BookID, &c.Number); err != nil {
			return nil, 0, fmt.Errorf("scanning chapter row: %w", err)
		}
		chapters = append(chapters, c)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterating chapter rows: %w", err)
	}

	var total int
	if err := r.pool.QueryRow(ctx, countChaptersQuery, book.ID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("counting chapters: %w", err)
	}

	return chapters, total, nil
}

func (r *ChapterRepository) FindChapterByNumberAndBookDynamicID(ctx context.Context, chapterNumber int, bookDynamicID string) (*bible.Chapter, error) {
	b, err := r.books.FindBookByDynamicID(ctx, bookDynamicID)
	if err != nil {
		return nil, err
	}

	c := &bible.Chapter{}
	if err := r.pool.QueryRow(ctx, findChapterByNumberAndBookDynamicIDQuery, chapterNumber, b.ID).Scan(&c.ID, &c.BookID, &c.Number); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, bible.ErrChapterNotFound
		}

		return nil, fmt.Errorf("querying chapter %d for book %q: %w", chapterNumber, bookDynamicID, err)
	}

	return c, nil
}

func (r *ChapterRepository) CreateChapter(ctx context.Context, raw *bible.Chapter) (*bible.Chapter, error) {
	c := &bible.Chapter{}
	if err := r.pool.QueryRow(ctx, createChapterQuery, raw.ID, raw.BookID, raw.Number).Scan(&c.ID, &c.BookID, &c.Number); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, bible.ErrChapterAlreadyExists
		}

		return nil, fmt.Errorf("creating chapter with id %q: %w", raw.ID, err)
	}

	return c, nil
}
