package server

import (
	"context"

	"github.com/davg/backend-applications/internal/domain/models"
	"github.com/davg/backend-applications/internal/domain/requests"
	"github.com/davg/backend-applications/pkg/middlewares/authorization"
	"github.com/gin-gonic/gin"
)

type ApplicationsService interface {
	Applications(ctx context.Context, status, userID string) ([]models.ApplicationModel, error)
	Application(ctx context.Context, id string) (*models.ApplicationModel, error)
	CreateApplication(ctx context.Context, application *requests.ApplcationRequest, payload *authorization.TokenPayload) (string, error)
	DeleteApplication(ctx context.Context, id string) error
}

type ApplicationsRouter struct {
	router  *gin.RouterGroup
	service ApplicationsService
}

func Register(
	router *gin.RouterGroup,
	service ApplicationsService,
) {
	r := &ApplicationsRouter{
		router:  router,
		service: service,
	}

	r.init()
}

func (r *ApplicationsRouter) GetApplications(ctx *gin.Context) {
	status := ctx.Query("status")
	userID := ctx.Query("user_id")

	applications, err := r.service.Applications(ctx, status, userID)
	if err != nil {
		HandleError(ctx, err)
		return
	}

	ctx.JSON(200, applications)
}

func (r *ApplicationsRouter) GetMyApplications(ctx *gin.Context) {
	tokenPayload, err := authorization.FromContext(ctx)
	if err != nil {
		HandleError(ctx, err)
		return
	}

	applications, err := r.service.Applications(ctx, "", tokenPayload.ID)
	if err != nil {
		HandleError(ctx, err)
		return
	}

	ctx.JSON(200, applications)
}

func (r *ApplicationsRouter) GetApplication(ctx *gin.Context) {
	id := ctx.Param("id")

	application, err := r.service.Application(ctx, id)
	if err != nil {
		HandleError(ctx, err)
		return
	}

	ctx.JSON(200, application)
}

func (r *ApplicationsRouter) CreateApplication(ctx *gin.Context) {
	payload, err := authorization.FromContext(ctx)
	if err != nil {
		HandleError(ctx, err)
		return
	}

	var application requests.ApplcationRequest
	if err := ctx.ShouldBindJSON(&application); err != nil {
		HandleError(ctx, err)
		return
	}

	applicationID, err := r.service.CreateApplication(ctx, &application, payload)
	if err != nil {
		HandleError(ctx, err)
		return
	}

	ctx.JSON(200, gin.H{"message": "success", "id": applicationID})
}

func (r *ApplicationsRouter) DeleteApplication(ctx *gin.Context) {
	if err := CheckIfAdmin(ctx); err != nil {
		HandleError(ctx, err)
		return
	}

	id := ctx.Param("id")

	if err := r.service.DeleteApplication(ctx, id); err != nil {
		HandleError(ctx, err)
		return
	}

	ctx.JSON(200, gin.H{"message": "success"})
}

func (r *ApplicationsRouter) init() {
	key := GetKey()

	group := r.router.Group("/applications")
	group.Use(authorization.MiddlwareJWT(key))
	group.GET("/", r.GetApplications)
	group.GET("/my", r.GetMyApplications)
	group.GET("/:id", r.GetApplication)
	group.POST("/", r.CreateApplication)
	group.DELETE("/:id", r.DeleteApplication)
}
