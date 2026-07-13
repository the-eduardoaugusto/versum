package remotelog

import "context"

// Editor is an optional capability on top of Publisher: only channels
// that support editing an already-sent message (Discord, Slack) implement
// it. A Publisher that doesn't implement Editor simply can't have its
// messages updated — Service.Update fails explicitly (ErrNotEditable)
// instead of assuming every channel can do this.
type Editor interface {
	Edit(ctx context.Context, messageID string, raw *RawLog) (*Log, error)
}
