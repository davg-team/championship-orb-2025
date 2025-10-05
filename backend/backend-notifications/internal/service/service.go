package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"

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

func (s *Service) SendTelegramMessage(ChatID int, Title, Body string) error {
	const op = "service.SendTelegramMessage"
	s.log.Info("Send Telegram message", slog.String("op", op), slog.Int("chat_id", ChatID))

	if err := SendTelegramMessage(ChatID, Title, Body); err != nil {
		s.log.Error("Failed to send Telegram message", op, err)
		return err
	}

	s.log.Info("Telegram message sent", slog.String("op", op), slog.Int("chat_id", ChatID))
	return nil
}

func (s *Service) SmartSend(ctx context.Context, smart_request request.SmartSend) error {
	const op = "service.SmartSend"
	s.log.Info("Smart send notifications", slog.String("op", op))

	token, err := GetAuthToken()
	if err != nil {
		s.log.Error("Failed to get auth token", op, err)
		return err
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	var errs []error

	for _, userID := range smart_request.UserIDs {
		user, err := GetUser(token, userID)
		if err != nil {
			s.log.Error("Failed to get user", op, err)
			continue
		}

		attrs, ok := user["attributes"].(map[string]interface{})
		if !ok {
			s.log.Error("Invalid user attributes format", op, nil, slog.String("user_id", userID))
			continue
		}

		channels, ok := attrs["notification_channels"].([]interface{})
		if !ok {
			s.log.Error("notification_channels missing or invalid", op, nil, slog.String("user_id", userID))
			continue
		}

		for _, ch := range channels {
			channel, _ := ch.(string)
			wg.Add(1)

			go func(channel string) {
				defer wg.Done()

				switch channel {
				case "email":
					err := s.SendMessage(ctx, request.SendSMTP{
						Subject: smart_request.Title,
						Body:    smart_request.Body,
					}, user["email"].(string))
					if err != nil {
						s.log.Error("Failed to send email", op, err, slog.String("user_id", userID))
						mu.Lock()
						errs = append(errs, err)
						mu.Unlock()
					}

				case "websocket":
					_, err := s.CreateNotification(ctx, request.CreateNotification{
						UserID:  userID,
						Subject: smart_request.Title,
						Body:    smart_request.Body,
						Custom:  smart_request.Custom,
					})
					if err != nil {
						s.log.Error("Failed to create websocket notification", op, err, slog.String("user_id", userID))
						mu.Lock()
						errs = append(errs, err)
						mu.Unlock()
					}

				case "telegram":
					ids, ok := attrs["telegram_id"].([]interface{})
					if !ok || len(ids) == 0 {
						s.log.Error("Telegram ID not found", op, nil, slog.String("user_id", userID))
						return
					}

					chatIDStr, ok := ids[0].(string)
					if !ok || chatIDStr == "" {
						s.log.Error("Invalid Telegram ID format", op, nil, slog.String("user_id", userID))
						return
					}

					var chatID int
					if _, err := fmt.Sscanf(chatIDStr, "%d", &chatID); err != nil {
						s.log.Error("Invalid Telegram chat ID format", op, err, slog.String("user_id", userID), slog.String("chat_id", chatIDStr))
						return
					}

					err := s.SendTelegramMessage(chatID, smart_request.Title, smart_request.Body)
					if err != nil {
						s.log.Error("Failed to send Telegram message", op, err, slog.String("user_id", userID), slog.Int("chat_id", chatID))
						mu.Lock()
						errs = append(errs, err)
						mu.Unlock()
					}

				default:
					s.log.Warn("Unknown notification channel", slog.String("channel", channel), slog.String("user_id", userID))
				}
			}(channel)
		}
	}

	wg.Wait()
	s.log.Info("Smart send notifications completed", slog.String("op", op))

	if len(errs) > 0 {
		return fmt.Errorf("%s: some notifications failed: %v", op, errs)
	}

	return nil
}
