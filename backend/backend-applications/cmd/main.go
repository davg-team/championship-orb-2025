package main

import (
	"log/slog"
	"os"
	"os/signal"

	"github.com/davg/backend-applications/internal/application"
)

func main() {
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	mainLogger := slog.New(h)

	app := application.New(mainLogger)

	app.Start()

	ch := make(chan os.Signal, 1)
	signal.Notify(ch, os.Interrupt)

	<-ch

	app.GracefulStop()
}
