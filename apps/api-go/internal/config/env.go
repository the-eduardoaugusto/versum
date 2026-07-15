package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Field struct {
	name string
	dest *string
}

func loadEnv(c *Config) error {
	if err := godotenv.Load(); err != nil {
		return err
	}
	fields := []Field{
		{
			name: "POSTGRES_URL",
			dest: &c.PostgresURL,
		},
		{
			name: "PORT",
			dest: &c.Port,
		},
		{
			name: "REDIS_URL",
			dest: &c.RedisURL,
		},
	}

	var missing []string
	for _, f := range fields {
		val, ok := os.LookupEnv(f.name)
		if !ok {
			missing = append(missing, f.name)
			continue
		}

		*f.dest = val
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing required env vars: %v", missing)
	}

	return nil
}
