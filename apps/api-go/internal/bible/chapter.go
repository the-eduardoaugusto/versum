package bible

type RawChapter struct {
	BookID string `json:"bookID"`
	Number int    `json:"number"`
}

type Chapter struct {
	ID string `json:"id"`
	RawChapter
}
