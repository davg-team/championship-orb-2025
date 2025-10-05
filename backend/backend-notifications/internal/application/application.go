package application

import (
	"log/slog"

	"github.com/davg/backend-notifications/internal/queue"
	"github.com/davg/backend-notifications/internal/server"
	"github.com/davg/backend-notifications/internal/service"
	"github.com/davg/backend-notifications/internal/storage"
	"github.com/gin-gonic/gin"
)

type Application struct {
	server *server.Server
	queue  *queue.RabbitMQ
}

func New(log *slog.Logger, queue *queue.RabbitMQ) *Application {
	storage := storage.New()

	service := service.NewService(log, storage, queue)

	server := server.New(service)

	return &Application{
		server: server,
	}
}

func (a *Application) Start() {
	a.server.Start()
}

func (a *Application) GracefulStop() {
	a.server.Stop()
}

func (a *Application) Router() *gin.Engine {
	return a.server.Router()
}
