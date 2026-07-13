package bible

type RawVerse struct {
	ChapterID string `json:"chapterId"`
	Number    int    `json:"number"`
	Text      string `json:"text"`
}

type Verse struct {
	ID string `json:"id"`
	RawVerse
}
