package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/davg/backend-notifications/internal/application"
	"github.com/davg/backend-notifications/internal/config"
	"github.com/davg/backend-notifications/internal/queue"
	"github.com/davg/backend-notifications/internal/worker"
)

func main() {
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	mainLogger := slog.New(h)

	cfg := config.Config()

	rabbit, err := queue.NewRabbitMQ(cfg.Rabbit.Url, "notifications")
	if err != nil {
		mainLogger.Error("Failed to connect to RabbitMQ", "op", "application.New", "err", err)
		panic(err)
	}
	defer rabbit.Close()

	emailWorker := worker.NewEmailWorker(mainLogger, rabbit)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// WaitGroup для отслеживания горутин
	var wg sync.WaitGroup

	// Запускаем воркер
	wg.Add(1)
	go func() {
		defer wg.Done()
		mainLogger.Info("Starting email worker")

		if err := emailWorker.Start(ctx); err != nil {
			mainLogger.Error("Worker failed", "error", err)
		}

		mainLogger.Info("Email worker stopped")
	}()

	// Запускаем приложение
	app := application.New(mainLogger, rabbit)
	app.Start()

	mainLogger.Info("Application started successfully")

	// Ожидаем сигналов для graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan
	mainLogger.Info("Received shutdown signal")

	// Graceful shutdown с таймаутом
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	// Останавливаем приложение
	app.GracefulStop()

	// Отменяем контекст для воркера
	cancel()

	// Ждем завершения воркера с таймаутом
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		mainLogger.Info("Worker shut down gracefully")
	case <-shutdownCtx.Done():
		mainLogger.Warn("Worker shutdown timeout exceeded")
	}

	mainLogger.Info("Application stopped")
}
