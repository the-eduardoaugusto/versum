package httputil

import (
	"encoding/json"
	"errors"
	"net/http"
)

type Error struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

func (e *Error) Error() string {
	return e.Message
}

func BadRequest(message string) *Error {
	return &Error{
		Status:  http.StatusBadRequest,
		Message: message,
	}
}

func NotFound(message string) *Error {
	return &Error{
		Status:  http.StatusNotFound,
		Message: message,
	}
}

func TooManyRequests(message string) *Error {
	return &Error{Status: http.StatusTooManyRequests, Message: message}
}

func ServiceUnavailable(message string) *Error {
	return &Error{Status: http.StatusServiceUnavailable, Message: message}
}

func WriteError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	if target, ok := errors.AsType[*Error](err); ok {
		w.WriteHeader(target.Status)
		json.NewEncoder(w).Encode(target)
		return
	}

	e := &Error{
		Status:  http.StatusInternalServerError,
		Message: "internal server error",
	}
	w.WriteHeader(e.Status)
	json.NewEncoder(w).Encode(e)
}
