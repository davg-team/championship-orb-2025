package application

import (
	"log/slog"

	"github.com/davg/backend-applications/internal/server"
	"github.com/davg/backend-applications/internal/service"
	"github.com/davg/backend-applications/internal/storage"
)

type Application struct {
	server *server.Server
}

func New(log *slog.Logger) *Application {
	storage := storage.New()

	service := service.New(log, storage)

	server := server.New(service)

	return &Application{
		server: server,
	}
}

func (a *Application) Start() {
	a.server.Start()
}

func (a *Application) GracefulStop() {
	a.server.GracefulStop()
}
