package bible

import "errors"

var ErrBookNotFound = errors.New("book not found")
var ErrChapterNotFound = errors.New("chapter not found")
var ErrVerseNotFound = errors.New("verse not found")

var ErrBookAlreadyExists = errors.New("book already exists")
var ErrChapterAlreadyExists = errors.New("chapter already exists")
var ErrVerseAlreadyExists = errors.New("verse already exists")
