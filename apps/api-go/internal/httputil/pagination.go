package httputil

import (
	"net/http"
	"strconv"
)

type Pagination struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
}

func ParsePagination(r *http.Request) (page, limit int) {
	q := r.URL.Query()
	pageRaw := q.Get("page")
	p, err := strconv.Atoi(pageRaw)
	if err != nil {
		p = 1
	}
	limitRaw := q.Get("limit")
	l, err := strconv.Atoi(limitRaw)
	if err != nil {
		return p, 1
	}

	return p, l
}
