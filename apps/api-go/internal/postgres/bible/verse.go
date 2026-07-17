package bible

import (
	"context"
	"errors"
	"fmt"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type VerseRepository struct {
	pool     *pgxpool.Pool
	chapters bible.ChapterRepository
}

func NewVerseRepository(pool *pgxpool.Pool, chapters bible.ChapterRepository) *VerseRepository {
	return &VerseRepository{
		pool:     pool,
		chapters: chapters,
	}
}

const (
	findVersesPaginatedByChapterNumberAndBookDynamicIDQuery = `SELECT id, chapter_id, "number", "text" FROM bible_verses WHERE chapter_id = $1 ORDER BY "number" LIMIT $2 OFFSET $3;`

	countVersesQuery = `SELECT count(*) FROM bible_verses WHERE chapter_id = $1;`

	findVerseByChapterNumberAndBookDynamicIDAndVerseNumberQuery = `SELECT id, chapter_id, "number", "text" FROM bible_verses WHERE "number" = $1 AND chapter_id = $2;`

	createVerseQuery = `INSERT INTO bible_verses (id, chapter_id, "number", "text")
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (chapter_id, "number") DO NOTHING
		RETURNING id, chapter_id, "number", "text";`
)

func (r *VerseRepository) FindVersesPaginatedByChapterNumberAndBookDynamicID(ctx context.Context, bookDynamicID string, chapterNumber, limit, page int) ([]*bible.Verse, int, error) {
	c, err := r.chapters.FindChapterByNumberAndBookDynamicID(ctx, chapterNumber, bookDynamicID)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.pool.Query(ctx, findVersesPaginatedByChapterNumberAndBookDynamicIDQuery, c.ID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("querying paginated verses: %w", err)
	}
	defer rows.Close()

	var verses []*bible.Verse
	for rows.Next() {
		v := &bible.Verse{}
		if err := rows.Scan(&v.ID, &v.ChapterID, &v.Number, &v.Text); err != nil {
			return nil, 0, fmt.Errorf("scanning verse row: %w", err)
		}
		verses = append(verses, v)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterating verses row: %w", err)
	}

	var total int
	if err := r.pool.QueryRow(ctx, countVersesQuery, c.ID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("counting verses: %w", err)
	}

	return verses, total, nil
}

func (r *VerseRepository) FindVerseByChapterNumberAndBookDynamicIDAndVerseNumber(ctx context.Context, bookDynamicID string, chapterNumber, verseNumber int) (*bible.Verse, error) {
	c, err := r.chapters.FindChapterByNumberAndBookDynamicID(ctx, chapterNumber, bookDynamicID)
	if err != nil {
		return nil, err
	}

	v := &bible.Verse{}
	if err := r.pool.QueryRow(ctx, findVerseByChapterNumberAndBookDynamicIDAndVerseNumberQuery, verseNumber, c.ID).Scan(&v.ID, &v.ChapterID, &v.Number, &v.Text); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, bible.ErrVerseNotFound
		}

		return nil, fmt.Errorf("querying verse %d for chapter %d for book %q: %w", verseNumber, chapterNumber, bookDynamicID, err)
	}

	return v, nil
}

func (r *VerseRepository) CreateVerse(ctx context.Context, raw *bible.Verse) (*bible.Verse, error) {
	v := &bible.Verse{}
	if err := r.pool.QueryRow(ctx, createVerseQuery, raw.ID, raw.ChapterID, raw.Number, raw.Text).Scan(&v.ID, &v.ChapterID, &v.Number, &v.Text); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, bible.ErrVerseAlreadyExists
		}

		return nil, fmt.Errorf("creating verse with id %q: %w", raw.ID, err)
	}

	return v, nil
}

func (r *VerseRepository) CreateVerses(ctx context.Context, verses []*bible.Verse) ([]*bible.Verse, int, error) {
	batch := &pgx.Batch{}
	for _, v := range verses {
		batch.Queue(createVerseQuery, v.ID, v.ChapterID, v.Number, v.Text)
	}

	br := r.pool.SendBatch(ctx, batch)
	defer br.Close()

	var resultVerses []*bible.Verse
	var versesErr []error
	for range verses {
		v := &bible.Verse{}
		if err := br.QueryRow().Scan(&v.ID, &v.ChapterID, &v.Number, &v.Text); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				versesErr = append(versesErr, bible.ErrVerseAlreadyExists)
				continue
			}

			versesErr = append(versesErr, fmt.Errorf("creating verse with id %q: %w", v.ID, err))
			continue
		}

		resultVerses = append(resultVerses, v)
	}

	if len(versesErr) > 0 {
		return resultVerses, len(resultVerses), errors.Join(versesErr...)
	}

	return resultVerses, len(resultVerses), nil
}
