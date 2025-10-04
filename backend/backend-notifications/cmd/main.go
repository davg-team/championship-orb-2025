package main

import (
	"log/slog"
	"net/http"
	"os"
	"os/signal"

	"github.com/davg/backend-notifications/internal/application"
	"github.com/gin-gonic/gin"
)

func main() {
	app.Run()

	ch := make(chan os.Signal, 1)
	signal.Notify(ch, os.Interrupt)

	<-ch

	app.Stop()
}

var app *application.Application
var router *gin.Engine

func init() {
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})
	mainLogger := slog.New(h)

	app = application.New(mainLogger)
	router = app.Router()
}

func Handle(w http.ResponseWriter, r *http.Request) {
	router.ServeHTTP(w, r)
}
