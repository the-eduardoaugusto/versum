package remotelog

type Level string

const (
	LevelDebug   Level = "debug"
	LevelInfo    Level = "info"
	LevelSuccess Level = "success"
	LevelAlert   Level = "alert"
	LevelError   Level = "error"
)

// MetaField is an optional key/value pair attached to the log. It's a
// slice, not a map, because display order matters. The caller decides
// which fields exist and what they're called; this package never invents
// field names on its own.
type MetaField struct {
	Key   string
	Value string
}

// RawLog is what any caller builds to publish a log — without knowing
// anything about which channel will receive it.
type RawLog struct {
	Slug    string
	Level   Level
	Message string
	Meta    []MetaField
}

type Log struct {
	MessageID string
	RawLog
}
