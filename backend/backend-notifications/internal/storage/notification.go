package storage

import (
	"context"

	"github.com/davg/backend-notifications/internal/domain/models"
)

func (s *Storage) Notifications(ctx context.Context) ([]models.Notification, error) {
	var notifications []models.Notification

	if err := s.db.Model(&models.Notification{}).Find(&notifications).Error; err != nil {
		return nil, err
	}
	return notifications, nil
}

func (s *Storage) Notification(ctx context.Context, id string) (*models.Notification, error) {
	var notification models.Notification

	if err := s.db.Model(&models.Notification{}).First(&notification, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &notification, nil
}

func (s *Storage) CreateNotification(ctx context.Context, notification models.Notification) error {
	return s.db.Model(&models.Notification{}).Create(&notification).Error
}

func (s *Storage) DeleteNotification(ctx context.Context, id string) error {
	return s.db.Model(&models.Notification{}).Delete(&models.Notification{}, "id = ?", id).Error
}

func (s *Storage) GetNotificationsByID(ctx context.Context, user_id string) ([]models.Notification, error) {
	var notifications []models.Notification

	if err := s.db.Model(&models.Notification{}).Where("user_id = ?", user_id).Find(&notifications).Error; err != nil {
		return nil, err
	}
	return notifications, nil
}

func (s *Storage) UpdateNewNotification(ctx context.Context, id string) error {
	return s.db.Model(&models.Notification{}).Where("id = ?", id).Update("is_new", false).Error
}
