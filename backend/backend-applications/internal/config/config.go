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
}

type serverConfig struct {
	Port string `env:"PORT" envDefault:"8080"`
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
