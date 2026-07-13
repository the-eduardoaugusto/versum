package remotelog

import "context"

// Publisher is the minimum contract for any remote-log channel: publish
// one log entry, once. Every implementation must satisfy this — including
// channels that can only fire-and-forget (email, SMS, a plain webhook
// with no edit endpoint).
type Publisher interface {
	Publish(ctx context.Context, raw *RawLog) (*Log, error)
}
