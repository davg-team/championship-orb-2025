package storage

import (
	"context"

	"github.com/davg/backend-applications/internal/domain/models"
)

func (s *Storage) Applications(ctx context.Context, status, userID string) ([]models.ApplicationModel, error) {
	var applications []models.ApplicationModel

	query := s.db.WithContext(ctx).Model(&models.ApplicationModel{})

	if status != "" {
		query = query.Where("application_status = ?", status)
	}

	if userID != "" {
		query = query.Joins("JOIN user_metainfos ON user_metainfos.application_model_id = application_models.id").
			Where("user_metainfos.id = ?", userID)
	}

	// Preload загружаем после фильтрации
	query = query.Preload("UserMetainfo")

	if err := query.Find(&applications).Error; err != nil {
		return nil, err
	}

	return applications, nil
}

func (s *Storage) Application(ctx context.Context, id string) (*models.ApplicationModel, error) {
	var application models.ApplicationModel

	if err := s.db.WithContext(ctx).Preload("UserMetainfo").Where("id = ?", id).First(&application).Error; err != nil {
		return nil, err
	}
	return &application, nil
}

func (s *Storage) CreateApplication(ctx context.Context, application *models.ApplicationModel) error {
	return s.db.WithContext(ctx).Create(application).Error
}

func (s *Storage) UpdateApplication(ctx context.Context, application *models.ApplicationModel) error {
	return s.db.WithContext(ctx).Save(application).Error
}

func (s *Storage) DeleteApplication(ctx context.Context, application *models.ApplicationModel) error {
	return s.db.WithContext(ctx).Delete(application).Error
}
