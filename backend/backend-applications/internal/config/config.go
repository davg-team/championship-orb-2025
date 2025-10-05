package config

import (
	"github.com/ilyakaznacheev/cleanenv"
)

const (
	UserRoleAdmin  = "admin"
	UserRoleEditor = "editor"
)

var cfg config

type config struct {
	Server  serverConfig
	Storage storageConfig

	Notifications notificationsConfig

	OpenBao openbaoConfig
}

type serverConfig struct {
	Port string `env:"PORT" envDefault:"8080"`
}

type notificationsConfig struct {
	URL string `env:"NOTIFICATIONS_URL" envDefault:"http://localhost:8081"`
}

type openbaoConfig struct {
	URL       string `env:"OPENBAO_URL" envDefault:"http://localhost:8200/v1"`
	RootToken string `env:"OPENBAO_ROOT_TOKEN" envDefault:"root_token"`
}

type storageConfig struct {
	DBHost     string `env:"DB_HOST" envDefault:"localhost"`
	DBPort     string `env:"DB_PORT" envDefault:"5432"`
	DBUser     string `env:"DB_USER" envDefault:"postgres"`
	DBPassword string `env:"DB_PASSWORD" envDefault:"postgres"`
	DBName     string `env:"DB_NAME" envDefault:"postgres"`
}

func Config() config {
	return cfg
}

func init() {
	if err := cleanenv.ReadEnv(&cfg); err != nil {
		panic(err)
	}
}
