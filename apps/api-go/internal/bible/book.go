package bible

type BookTestament string

const (
	OldTestament BookTestament = "old"
	NewTestament BookTestament = "new"
)

type RawBook struct {
	Order        int           `json:"order"`
	Name         string        `json:"name"`
	Abbreviation string        `json:"abbreviation"`
	Testament    BookTestament `json:"testament"`
}

type Book struct {
	ID string `json:"id"`
	RawBook
}
