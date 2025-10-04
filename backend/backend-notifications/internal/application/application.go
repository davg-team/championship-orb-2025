package application

import (
	"log/slog"

	"github.com/davg/backend-notifications/internal/config"
	"github.com/davg/backend-notifications/internal/queue"
	"github.com/davg/backend-notifications/internal/server"
	"github.com/davg/backend-notifications/internal/service"
	"github.com/davg/backend-notifications/internal/storage"
	"github.com/gin-gonic/gin"
)

type Application struct {
	server *server.Server
}

func New(log *slog.Logger) *Application {
	cfg := config.Config().Rabbit

	storage := storage.New()

	rabbit, err := queue.NewRabbitMQ(cfg.Url, "notifications")
	if err != nil {
		log.Error("Failed to connect to RabbitMQ", "op", "application.New", "err", err)
		panic(err)
	}

	service := service.NewService(log, storage, rabbit)

	server := server.New(service)
	return &Application{
		server: server,
	}
}

func (a *Application) Run() {
	a.server.Start()
}

func (a *Application) Stop() {
	a.server.Stop()
}

func (a *Application) Router() *gin.Engine {
	return a.server.Router()
}
