package server

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/davg/backend-notifications/internal/config"
	"github.com/gin-gonic/gin"
)

type Server struct {
	server *http.Server
	engine *gin.Engine
}

func New(service Service) *Server {
	cfg := config.Config().Server
	engine := gin.Default()

	httpServer := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: engine,
	}

	group := engine.Group("/api")

	group.GET("/ping", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	Register(group, service)

	return &Server{
		server: httpServer,
		engine: engine,
	}
}

func (s *Server) Start() {
	if err := s.server.ListenAndServe(); err != nil {
		panic(err)
	}
}

func (s *Server) Stop() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.server.Shutdown(ctx); err != nil {
		panic(err)
	}
}

func (s *Server) Router() *gin.Engine {
	return s.engine
}
