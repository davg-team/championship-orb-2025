package server

import (
	"context"
	"fmt"

	"github.com/davg/backend-applications/internal/domain/models"
	"github.com/davg/backend-applications/internal/domain/requests"
	"github.com/davg/backend-applications/pkg/middlewares/authorization"
	"github.com/gin-gonic/gin"
)

type ApplicationsService interface {
	Applications(ctx context.Context, status, userID string) ([]models.ApplicationModel, error)
	Application(ctx context.Context, id string) (*models.ApplicationModel, error)
	CreateApplication(ctx context.Context, application *requests.ApplcationRequest, payload *authorization.TokenPayload) (string, error)
	ApproveApplication(ctx context.Context, id string, metainfo *requests.ApproveApplicationRequest) error
	DenyApplication(ctx context.Context, id, adminComment string) error
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
	fmt.Println(id)

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

func (r *ApplicationsRouter) ApproveApplication(ctx *gin.Context) {
	if err := CheckIfAdmin(ctx); err != nil {
		HandleError(ctx, err)
		return
	}

	id := ctx.Param("id")

	var metainfo requests.ApproveApplicationRequest
	if err := ctx.ShouldBindJSON(&metainfo); err != nil {
		HandleError(ctx, err)
		return
	}

	if err := r.service.ApproveApplication(ctx, id, &metainfo); err != nil {
		HandleError(ctx, err)
		return
	}

	ctx.JSON(200, gin.H{"message": "success"})
}

func (r *ApplicationsRouter) DenyApplication(ctx *gin.Context) {
	if err := CheckIfAdmin(ctx); err != nil {
		HandleError(ctx, err)
		return
	}

	id := ctx.Param("id")

	adminComment := struct {
		AdminComment string `json:"admin_comment"`
	}{}

	if err := ctx.ShouldBindJSON(&adminComment); err != nil {
		HandleError(ctx, err)
		return
	}

	if err := r.service.DenyApplication(ctx, id, adminComment.AdminComment); err != nil {
		HandleError(ctx, err)
		return
	}

	ctx.JSON(200, gin.H{"message": "success"})
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

	group.POST("/:id/approve", r.ApproveApplication)
	group.POST("/:id/deny", r.DenyApplication)

	group.DELETE("/:id", r.DeleteApplication)
}
