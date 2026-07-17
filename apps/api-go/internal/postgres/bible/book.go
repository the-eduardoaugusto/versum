package bible

import (
	"context"
	"errors"
	"fmt"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	findBooksPaginatedQuery = `SELECT id, "order", name, abbreviation, testament
        FROM bible_books ORDER BY "order" LIMIT $1 OFFSET $2;`

	findBookByDynamicIDQuery = `SELECT id, "order", name, abbreviation, testament
        FROM bible_books WHERE name = $1 OR abbreviation = $1;`

	countBooksQuery = `SELECT count(*) FROM bible_books;`

	createBookQuery = `INSERT INTO bible_books (id, "order", name, abbreviation, testament)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (id) DO NOTHING
		RETURNING id, "order", name, abbreviation, testament;`
)

type BookRepository struct {
	pool *pgxpool.Pool
}

func NewBookRepository(pool *pgxpool.Pool) *BookRepository {
	return &BookRepository{
		pool: pool,
	}
}

func (r *BookRepository) FindBooksPaginated(ctx context.Context, limit, page int) ([]*bible.Book, int, error) {
	offset := (page - 1) * limit
	rows, err := r.pool.Query(ctx, findBooksPaginatedQuery, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("querying paginated books: %w", err)
	}
	defer rows.Close()

	var books []*bible.Book
	for rows.Next() {
		b := &bible.Book{}
		if err := rows.Scan(&b.ID, &b.Order, &b.Name, &b.Abbreviation, &b.Testament); err != nil {
			return nil, 0, fmt.Errorf("scanning book row: %w", err)
		}
		books = append(books, b)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterating book rows: %w", err)
	}

	var total int
	if err := r.pool.QueryRow(ctx, countBooksQuery).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("counting books: %w", err)
	}

	return books, total, nil
}

func (r *BookRepository) FindBookByDynamicID(ctx context.Context, dynamicID string) (*bible.Book, error) {
	b := &bible.Book{}
	if err := r.pool.QueryRow(ctx, findBookByDynamicIDQuery, dynamicID).Scan(&b.ID, &b.Order, &b.Name, &b.Abbreviation, &b.Testament); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, bible.ErrBookNotFound
		}
		return nil, fmt.Errorf("querying book by dynamic id %q: %w", dynamicID, err)
	}

	return b, nil
}

func (r *BookRepository) CreateBook(ctx context.Context, raw *bible.Book) (*bible.Book, error) {
	b := &bible.Book{}
	if err := r.pool.QueryRow(ctx, createBookQuery, raw.ID, raw.Order, raw.Name, raw.Abbreviation, raw.Testament).Scan(&b.ID, &b.Order, &b.Name, &b.Abbreviation, &b.Testament); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, bible.ErrBookAlreadyExists
		}

		return nil, fmt.Errorf("creating book with id %q: %w", raw.ID, err)
	}

	return b, nil
}
