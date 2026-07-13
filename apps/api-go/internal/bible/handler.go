package bible

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/httputil"
)

type Handler struct {
	service *BibleService
}

func NewHandler(service *BibleService) *Handler {
	return &Handler{service: service}
}

func RegisterRoutes(m *http.ServeMux, h *Handler) {
	m.HandleFunc("GET /books", h.GetPaginatedBooks)
	m.HandleFunc("GET /books/{dynamicID}", h.GetBook)
	m.HandleFunc("GET /books/{dynamicID}/chapters", h.GetPaginatedChapters)
	m.HandleFunc("GET /books/{dynamicID}/chapters/{chapterNumber}", h.GetChapter)
	m.HandleFunc("GET /books/{dynamicID}/chapters/{chapterNumber}/verses", h.GetPaginatedVerses)
	m.HandleFunc("GET /books/{dynamicID}/chapters/{chapterNumber}/verses/{verseNumber}", h.GetVerse)
}

func (h *Handler) GetPaginatedBooks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	page, limit := httputil.ParsePagination(r)
	data, total, err := h.service.FindBooksPaginated(ctx, limit, page)

	if err != nil {
		httputil.WriteError(w, err)
		return
	}

	pagination := &httputil.Pagination{
		Page:  page,
		Limit: limit,
		Total: total,
	}
	body := &httputil.Response{
		Data:       data,
		Pagination: pagination,
		Message:    "books fetched successfully",
	}
	httputil.WriteJSON(w, http.StatusOK, body)
}

func (h *Handler) GetBook(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	dynamicID := r.PathValue("dynamicID")

	book, err := h.service.FindBookByDynamicID(ctx, dynamicID)
	if err != nil {
		if errors.Is(err, ErrBookNotFound) {
			e := httputil.NotFound("book not found")
			httputil.WriteError(w, e)
			return
		}
		httputil.WriteError(w, err)
		return
	}

	b := httputil.Response{
		Data:    book,
		Message: "book fetched successfully",
	}

	httputil.WriteJSON(w, http.StatusOK, b)
}

func (h *Handler) GetPaginatedChapters(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	page, limit := httputil.ParsePagination(r)
	bookDynamicID := r.PathValue("dynamicID")
	chapters, total, err := h.service.FindChaptersPaginatedByBookDynamicID(ctx, bookDynamicID, limit, page)
	if err != nil {
		if errors.Is(err, ErrBookNotFound) {
			e := httputil.NotFound("book not found")
			httputil.WriteError(w, e)
			return
		}
		httputil.WriteError(w, err)
		return
	}
	pagination := &httputil.Pagination{
		Page:  page,
		Limit: limit,
		Total: total,
	}

	body := &httputil.Response{
		Data:       chapters,
		Pagination: pagination,
		Message:    "chapters fetched successfully",
	}

	httputil.WriteJSON(w, http.StatusOK, body)
}

func (h *Handler) GetChapter(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bookDynamicID := r.PathValue("dynamicID")
	chapterNumberRaw := r.PathValue("chapterNumber")
	chapterNumber, err := strconv.Atoi(chapterNumberRaw)
	if err != nil {
		e := httputil.BadRequest("chapter number should be a valid number")
		httputil.WriteError(w, e)
		return
	}

	if chapterNumber < 1 {
		e := httputil.BadRequest("chapter number should be greater 0 (zero)")
		httputil.WriteError(w, e)
		return
	}

	chapter, err := h.service.FindChapterByNumberAndBookDynamicID(ctx, chapterNumber, bookDynamicID)
	if err != nil {
		if errors.Is(err, ErrBookNotFound) {
			e := httputil.NotFound("book not found")
			httputil.WriteError(w, e)
			return
		}
		if errors.Is(err, ErrChapterNotFound) {
			e := httputil.NotFound("chapter not found")
			httputil.WriteError(w, e)
			return
		}
		httputil.WriteError(w, err)
		return
	}

	body := &httputil.Response{
		Data:    chapter,
		Message: "chapter fetched successfully",
	}

	httputil.WriteJSON(w, http.StatusOK, body)
}

func (h *Handler) GetPaginatedVerses(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bookDynamicID := r.PathValue("dynamicID")
	chapterNumberRaw := r.PathValue("chapterNumber")
	chapterNumber, err := strconv.Atoi(chapterNumberRaw)
	if err != nil {
		e := httputil.BadRequest("chapter number should be a valid number")
		httputil.WriteError(w, e)
		return
	}
	if chapterNumber < 1 {
		e := httputil.BadRequest("chapter number should be greater 0 (zero)")
		httputil.WriteError(w, e)
		return
	}

	page, limit := httputil.ParsePagination(r)
	verses, total, err := h.service.FindVersesPaginatedByChapterNumberAndBookDynamicID(ctx, bookDynamicID, chapterNumber, limit, page)
	if err != nil {
		if errors.Is(err, ErrBookNotFound) {
			e := httputil.NotFound("book not found")
			httputil.WriteError(w, e)
			return
		}
		if errors.Is(err, ErrChapterNotFound) {
			e := httputil.NotFound("chapter not found")
			httputil.WriteError(w, e)
			return
		}
		httputil.WriteError(w, err)
		return
	}

	pagination := &httputil.Pagination{
		Page:  page,
		Limit: limit,
		Total: total,
	}

	body := &httputil.Response{
		Data:       verses,
		Message:    "verses fetched successfully",
		Pagination: pagination,
	}

	httputil.WriteJSON(w, http.StatusOK, body)
}

func (h *Handler) GetVerse(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bookDynamicID := r.PathValue("dynamicID")
	chapterNumberRaw := r.PathValue("chapterNumber")
	chapterNumber, err := strconv.Atoi(chapterNumberRaw)
	if err != nil {
		e := httputil.BadRequest("chapter number should be a valid number")
		httputil.WriteError(w, e)
		return
	}
	if chapterNumber < 1 {
		e := httputil.BadRequest("chapter number should be greater 0 (zero)")
		httputil.WriteError(w, e)
		return
	}
	verseNumberRaw := r.PathValue("verseNumber")
	verseNumber, err := strconv.Atoi(verseNumberRaw)
	if err != nil {
		e := httputil.BadRequest("verse number should be a valid number")
		httputil.WriteError(w, e)
		return
	}
	if verseNumber < 1 {
		e := httputil.BadRequest("verse number should be greater 0 (zero)")
		httputil.WriteError(w, e)
		return
	}
	verse, err := h.service.FindVerseByChapterNumberAndBookDynamicIDAndVerseNumber(ctx, bookDynamicID, chapterNumber, verseNumber)
	if err != nil {
		if errors.Is(err, ErrBookNotFound) {
			e := httputil.NotFound("book not found")
			httputil.WriteError(w, e)
			return
		}
		if errors.Is(err, ErrChapterNotFound) {
			e := httputil.NotFound("chapter not found")
			httputil.WriteError(w, e)
			return
		}
		if errors.Is(err, ErrVerseNotFound) {
			e := httputil.NotFound("verse not found")
			httputil.WriteError(w, e)
			return
		}
		httputil.WriteError(w, err)
		return
	}

	body := &httputil.Response{
		Data:    verse,
		Message: "verse fetched successfully",
	}

	httputil.WriteJSON(w, http.StatusOK, body)
}
