package idgen

import (
	"crypto/rand"
	"fmt"
)

// New generate one UUID v4 (random), return format:
// "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".
func New() string {
	var b [16]byte

	if _, err := rand.Read(b[:]); err != nil {
		panic(fmt.Sprintf("idgen: falha ao ler bytes aleatórios: %v", err))
	}

	b[6] = (b[6] & 0x0f) | 0x40 // v4
	b[8] = (b[8] & 0x3f) | 0x80 // RFC 4122

	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
