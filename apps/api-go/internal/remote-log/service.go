package remotelog

import (
	"context"
	"errors"
)

var ErrNotEditable = errors.New("remotelog: publisher does not support editing messages")

type Service struct {
	publisher Publisher
}

func NewService(publisher Publisher) *Service {
	return &Service{publisher: publisher}
}

func (s *Service) Notify(ctx context.Context, raw RawLog) (*Log, error) {
	return s.publisher.Publish(ctx, &raw)
}

// Update edits a previously published message. It only works if the
// concrete Publisher passed to NewService also implements Editor — the
// check is explicit, not assumed.
func (s *Service) Update(ctx context.Context, messageID string, raw RawLog) (*Log, error) {
	editor, ok := s.publisher.(Editor)
	if !ok {
		return nil, ErrNotEditable
	}
	return editor.Edit(ctx, messageID, &raw)
}
