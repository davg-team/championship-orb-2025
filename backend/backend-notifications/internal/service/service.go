package service

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/davg/backend-notifications/internal/domain/models"
	"github.com/davg/backend-notifications/internal/domain/request"
	"github.com/google/uuid"
)

type Service struct {
	log     slog.Logger
	storage Storage
	queue   Queue
}

type Queue interface {
	Publish(body []byte) error
	Consume(handler func([]byte) error) error
}

type Storage interface {
	Notifications(ctx context.Context) ([]models.Notification, error)
	Notification(ctx context.Context, id string) (*models.Notification, error)
	CreateNotification(ctx context.Context, notification models.Notification) error
	DeleteNotification(ctx context.Context, id string) error
	GetNotificationsByID(ctx context.Context, user_id string) ([]models.Notification, error)
	UpdateNewNotification(ctx context.Context, id string) error
}

func NewService(log *slog.Logger, storage Storage, queue Queue) *Service {
	return &Service{
		log:     *log,
		storage: storage,
		queue:   queue,
	}
}

func (s *Service) SendMessage(ctx context.Context, respose request.SendSMTP, email string) error {
	const op = "service.SentMessage"

	s.log.Info("Publish email task to queue", slog.String("op", op))

	payload := map[string]interface{}{
		"type":    "email",
		"email":   email,
		"subject": respose.Subject,
		"body":    respose.Body,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		s.log.Error("Failed to marshal email payload", op, err)
		return err
	}

	if err := s.queue.Publish(data); err != nil {
		s.log.Error("Failed to publish email to queue", op, err)
		return err
	}

	s.log.Info("Email task published", slog.String("op", op))
	return nil
}

func (s *Service) Notifications(ctx context.Context) ([]models.Notification, error) {
	const op = "service.Notifications"
	s.log.Info("Get all notifications", slog.String("op", op))

	notifications, err := s.storage.Notifications(ctx)
	if err != nil {
		s.log.Error("Failed to get notifications", op, err)
		return nil, err
	}

	s.log.Info("Notifications retrieved", slog.String("op", op))
	return notifications, nil
}

func (s *Service) Notification(ctx context.Context, id string) (*models.Notification, error) {
	const op = "service.Notification"
	s.log.Info("Get notification by ID", slog.String("op", op), slog.String("id", id))

	notification, err := s.storage.Notification(ctx, id)
	if err != nil {
		s.log.Error("Failed to get notification", op, err)
		return nil, err
	}

	s.log.Info("Notification retrieved", slog.String("op", op), slog.String("id", id))
	return notification, nil
}

func (s *Service) CreateNotification(ctx context.Context, notification request.CreateNotification) (string, error) {
	const op = "service.CreateNotification"

	s.log.Info("Create notification", slog.String("op", op))

	newNotification := models.Notification{
		ID:      uuid.New().String(),
		UserID:  notification.UserID,
		Subject: notification.Subject,
		Body:    notification.Body,
		Custom:  notification.Custom,
		IsNew:   true,
	}

	if err := s.storage.CreateNotification(ctx, newNotification); err != nil {
		s.log.Error("Failed to create notification", op, err)
		return "", err
	}

	payload := map[string]interface{}{
		"type": "notification",
		"data": newNotification,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		s.log.Error("Failed to marshal notification payload", op, err)
		return "", err
	}
	if err := s.queue.Publish(data); err != nil {
		s.log.Error("Failed to publish notification to queue", op, err)
		return "", err
	}

	s.log.Info("Notification created and published", slog.String("op", op))
	return newNotification.ID, nil
}

func (s *Service) DeleteNotification(ctx context.Context, id string) error {
	const op = "service.DeleteNotification"
	s.log.Info("Delete notification", slog.String("op", op), slog.String("id", id))

	if err := s.storage.DeleteNotification(ctx, id); err != nil {
		s.log.Error("Failed to delete notification", op, err)
		return err
	}

	payload := map[string]interface{}{
		"type": "delete_notification",
		"id":   id,
	}
	if data, err := json.Marshal(payload); err == nil {
		s.queue.Publish(data)
	}

	s.log.Info("Notification deleted", slog.String("op", op), slog.String("id", id))
	return nil
}

func (s *Service) GetNotificationsByID(ctx context.Context, user_id string) ([]models.Notification, error) {
	const op = "service.GetNotificationsByID"
	s.log.Info("Get notification by user ID", slog.String("op", op), slog.String("user_id", user_id))

	notifications, err := s.storage.GetNotificationsByID(ctx, user_id)
	if err != nil {
		s.log.Error("Failed to get notification", op, err)
		return nil, err
	}

	var newNotifications []models.Notification
	for _, notification := range notifications {
		if notification.IsNew {
			newNotifications = append(newNotifications, notification)
			if err := s.storage.UpdateNewNotification(ctx, notification.ID); err != nil {
				s.log.Error("Failed to update notification", op, err)
				return nil, err
			}

			payload := map[string]interface{}{
				"type": "read_notification",
				"id":   notification.ID,
			}
			if data, err := json.Marshal(payload); err == nil {
				s.queue.Publish(data)
			}
		}
	}

	s.log.Info("Notification retrieved", slog.String("op", op), slog.String("user_id", user_id))
	return newNotifications, nil
}
