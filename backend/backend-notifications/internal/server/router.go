package server

import (
	"context"

	"github.com/davg/backend-notifications/internal/config"
	"github.com/davg/backend-notifications/internal/domain/models"
	"github.com/davg/backend-notifications/internal/domain/request"
	"github.com/gin-gonic/gin"
)

type Service interface {
	SendMessage(ctx context.Context, respose request.SendSMTP, email string) error
	Notifications(ctx context.Context) ([]models.Notification, error)
	Notification(ctx context.Context, id string) (*models.Notification, error)
	CreateNotification(ctx context.Context, notification request.CreateNotification) (string, error)
	DeleteNotification(ctx context.Context, id string) error
	GetNotificationsByID(ctx context.Context, user_id string) ([]models.Notification, error)
}

type Router struct {
	router  *gin.RouterGroup
	service Service
}

func Register(router *gin.RouterGroup, service Service) {
	r := &Router{
		router:  router,
		service: service,
	}
	r.init()
}

func (r *Router) Send(ctx *gin.Context) {
	var respose request.SendSMTP

	if err := ctx.ShouldBindJSON(&respose); err != nil {
		HandleError(ctx, err)
		return
	}

	email := ctx.Query("to")

	if email == "admin" {
		email = config.Config().Admin.Email
	}

	if err := r.service.SendMessage(ctx, respose, email); err != nil {
		HandleError(ctx, err)
		return
	}

	ctx.JSON(200, gin.H{"status": "success"})
}

func (r *Router) Notifications(ctx *gin.Context) {
	user_id := ctx.Query("user_id")

	var notificationToReturn []models.Notification

	if user_id != "" {
		notification, err := r.service.GetNotificationsByID(ctx, user_id)
		if err != nil {
			HandleError(ctx, err)
			return
		}
		notificationToReturn = notification
	} else {
		notification, err := r.service.Notifications(ctx)
		if err != nil {
			HandleError(ctx, err)
			return
		}
		notificationToReturn = notification
	}

	ctx.JSON(200, gin.H{"status": "success", "data": notificationToReturn})
}

func (r *Router) Notification(ctx *gin.Context) {
	id := ctx.Param("id")

	notification, err := r.service.Notification(ctx, id)
	if err != nil {
		HandleError(ctx, err)
		return
	}

	ctx.JSON(200, gin.H{"status": "success", "data": notification})
}

func (r *Router) CreateNotification(ctx *gin.Context) {
	var notification request.CreateNotification
	if err := ctx.ShouldBindJSON(&notification); err != nil {
		HandleError(ctx, err)
		return
	}

	id, err := r.service.CreateNotification(ctx, notification)
	if err != nil {
		HandleError(ctx, err)
		return
	}

	ctx.JSON(200, gin.H{"status": "success", "id": id})
}

func (r *Router) DeleteNotification(ctx *gin.Context) {
	id := ctx.Param("id")

	if err := r.service.DeleteNotification(ctx, id); err != nil {
		HandleError(ctx, err)
		return
	}

	ctx.JSON(200, gin.H{"status": "success"})
}

func (r *Router) init() {
	group := r.router.Group("/notifications")

	group.POST("/send", r.Send)

	group.GET("/", r.Notifications)
	group.GET("/:id", r.Notification)
	group.POST("/", r.CreateNotification)
	group.DELETE("/:id", r.DeleteNotification)
}
