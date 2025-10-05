package storage

import (
	"fmt"

	"github.com/davg/backend-applications/internal/config"
	"github.com/davg/backend-applications/internal/domain/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Storage struct {
	db *gorm.DB
}

func New() *Storage {
	cfg := config.Config().Storage

	db, err := gorm.Open(postgres.Open(
		fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
			cfg.DBHost,
			cfg.DBUser,
			cfg.DBPassword,
			cfg.DBName,
			cfg.DBPort,
		),
	),
		&gorm.Config{},
	)

	if err != nil {
		panic(err)
	}

	if err := db.AutoMigrate(&models.ApplicationModel{}); err != nil {
		panic(err)
	}

	if err := db.AutoMigrate(&models.UserMetainfo{}); err != nil {
		panic(err)
	}

	return &Storage{db: db}
}
