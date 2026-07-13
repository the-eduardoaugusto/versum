package taskrun

import (
	"context"
	"strings"

	remotelog "github.com/eduardoaugustolb/versum/apps/api-go/internal/remote-log"
)

// Notifier is the subset of remotelog.Service that Run needs. Defined
// here, by the consumer, not by remotelog — so taskrun depends on the
// smallest possible contract, not on remotelog.Service as a concrete type.
type Notifier interface {
	Notify(ctx context.Context, raw remotelog.RawLog) (*remotelog.Log, error)
	Update(ctx context.Context, messageID string, raw remotelog.RawLog) (*remotelog.Log, error)
}

// Run tracks a long-running task as a single message that keeps getting
// edited — one call per meaningful step, all folded into the same log
// entry instead of spamming a new message per line. It knows nothing
// about Discord, Slack, or any channel-specific limit, and it doesn't
// track timing itself — if the caller wants a "started at" in the final
// summary, that's on the caller (see Finish's meta parameter below).
//
// Run always edits the same message after the first Append/Start, so the
// publisher backing this Notifier must implement remotelog.Editor — if it
// doesn't, Update returns remotelog.ErrNotEditable on the first edit
// attempt.
type Run struct {
	notifier  Notifier
	slug      string
	messageID string
	lines     []string
}

func New(notifier Notifier, slug string) *Run {
	return &Run{notifier: notifier, slug: slug}
}

func (r *Run) Start(ctx context.Context) error {
	r.lines = nil
	r.messageID = ""
	return r.Append(ctx, remotelog.LevelInfo, "started")
}

func (r *Run) Append(ctx context.Context, level remotelog.Level, line string) error {
	r.lines = append(r.lines, line)
	raw := r.buildRawLog(level, nil)

	if r.messageID == "" {
		log, err := r.notifier.Notify(ctx, raw)
		if err != nil {
			return err
		}
		r.messageID = log.MessageID
		return nil
	}

	_, err := r.notifier.Update(ctx, r.messageID, raw)
	return err
}

// Finish closes the run. meta is entirely up to the caller — Run doesn't
// invent field names like "started at" on its own; the caller decides
// what's worth showing in the summary.
func (r *Run) Finish(ctx context.Context, level remotelog.Level, summary string, meta []remotelog.MetaField) error {
	r.lines = append(r.lines, summary)
	_, err := r.notifier.Update(ctx, r.messageID, r.buildRawLog(level, meta))
	return err
}

func (r *Run) buildRawLog(level remotelog.Level, meta []remotelog.MetaField) remotelog.RawLog {
	return remotelog.RawLog{
		Slug:    r.slug,
		Level:   level,
		Message: strings.Join(r.lines, "\n"),
		Meta:    meta,
	}
}
