// worker/email_worker.go
package worker

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/davg/backend-notifications/internal/service"
)

type EmailWorker struct {
	log   *slog.Logger
	queue Queue // интерфейс твоей очереди
}

type Queue interface {
	Consume(handler func([]byte) error) error
}

type EmailTask struct {
	Type    string `json:"type"`
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func NewEmailWorker(log *slog.Logger, queue Queue) *EmailWorker {
	return &EmailWorker{
		log:   log,
		queue: queue,
	}
}

func (w *EmailWorker) Start(ctx context.Context) error {
	w.log.Info("Starting email worker")

	errChan := make(chan error, 1)

	go func() {
		errChan <- w.queue.Consume(func(data []byte) error {
			select {
			case <-ctx.Done():
				w.log.Info("Context cancelled, stopping message processing")
				return ctx.Err()
			default:
			}

			return w.handleMessage(ctx, data)
		})
	}()

	select {
	case err := <-errChan:
		return err
	case <-ctx.Done():
		w.log.Info("Worker context cancelled")
		return ctx.Err()
	}
}

func (w *EmailWorker) handleMessage(ctx context.Context, data []byte) error {
	var task EmailTask

	if err := json.Unmarshal(data, &task); err != nil {
		w.log.Error("Failed to unmarshal email task", "error", err)
		return err
	}

	w.log.Info("Processing email task",
		slog.String("email", task.Email),
		slog.String("subject", task.Subject))

	// Отправляем email
	if err := service.SendEmail(ctx, task.Email, task.Subject, task.Body); err != nil {
		w.log.Error("Failed to send email", "error", err)
		return err
	}

	w.log.Info("Email sent successfully", slog.String("email", task.Email))
	return nil
}
