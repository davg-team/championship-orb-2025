package config

import (
	"github.com/ilyakaznacheev/cleanenv"
	"github.com/joho/godotenv"
)

const (
	UserRoleAdmin  = "admin"
	UserRoleEditor = "editor"
)

var cfg config

type config struct {
	SMTP    smtpConfig
	Admin   adminConfig
	Server  serverConfig
	Storage storageConfig
	Rabbit  rabbitMQConfig
}

type smtpConfig struct {
	Host     string `env:"SMTP_HOST"`
	Port     int    `env:"SMTP_PORT"`
	Username string `env:"SMTP_USERNAME"`
	Password string `env:"SMTP_PASSWORD"`
	From     string `env:"SMTP_FROM"`
}

type adminConfig struct {
	Email string `env:"ADMIN_EMAIL"`
}

type storageConfig struct {
	Host   string `env:"STORAGE_HOST"`
	Port   int    `env:"STORAGE_PORT"`
	User   string `env:"STORAGE_USER"`
	Pass   string `env:"STORAGE_PASS"`
	DbName string `env:"STORAGE_DB_NAME"`
}

type rabbitMQConfig struct {
	Url string `env:"RABBITMQ_URL"`
}

type serverConfig struct {
	Port string `env:"PORT" envDefault:"8080"`
}

func Config() config {
	return cfg
}

func init() {
	// FIXME: TEMPORARY SOLUTION
	godotenv.Load(".env")
	if err := cleanenv.ReadEnv(&cfg); err != nil {
		panic(err)
	}
}
