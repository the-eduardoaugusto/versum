package httputil

import (
	"encoding/json"
	"net/http"
)

type Response struct {
	Data       any         `json:"data"`
	Pagination *Pagination `json:"pagination,omitempty"`
	Message    string      `json:"message"`
}

func WriteJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if body != nil {
		json.NewEncoder(w).Encode(body)
	}
}
