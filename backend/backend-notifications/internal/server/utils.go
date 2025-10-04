package server

import (
	"errors"

	"github.com/davg/backend-notifications/internal/customerrors"
	"github.com/gin-gonic/gin"
)

func HandleError(ctx *gin.Context, err error) {
	if errors.Is(err, customerrors.ErrBadRequest) {
		ctx.JSON(400, gin.H{"status": "error", "message": err.Error()})
	} else if errors.Is(err, customerrors.ErrNotFound) {
		ctx.JSON(404, gin.H{"status": "error", "message": err.Error()})
	} else if errors.Is(err, customerrors.ErrForbidden) {
		ctx.JSON(403, gin.H{"status": "error", "message": err.Error()})
	} else if errors.Is(err, customerrors.ErrConflict) {
		ctx.JSON(409, gin.H{"status": "error", "message": err.Error()})
	} else if errors.Is(err, customerrors.ErrInternal) {
		ctx.JSON(500, gin.H{"status": "error", "message": err.Error()})
	} else {
		ctx.JSON(500, gin.H{"status": "error", "message": err.Error()})
	}
}
