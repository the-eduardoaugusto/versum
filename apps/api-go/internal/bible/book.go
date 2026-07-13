package bible

type BookTestament string

const (
	OldTestament BookTestament = "old"
	NewTestament BookTestament = "new"
)

type Book struct {
	ID           string
	Order        int
	Name         string
	Abbreviation string
	Testament    BookTestament
}
