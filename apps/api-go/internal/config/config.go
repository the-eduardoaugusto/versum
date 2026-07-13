package config

type Config struct {
	PostgresURL string
	Port        string
}

func Load() (*Config, error) {
	config := &Config{}
	if err := loadEnv(config); err != nil {
		return nil, err
	}
	return config, nil
}
