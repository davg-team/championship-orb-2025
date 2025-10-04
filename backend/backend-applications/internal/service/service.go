package service

import (
	"context"
	"log/slog"

	"github.com/davg/backend-applications/internal/customerrors"
	"github.com/davg/backend-applications/internal/domain/models"
	"github.com/davg/backend-applications/internal/domain/requests"
	"github.com/davg/backend-applications/pkg/middlewares/authorization"
	"github.com/google/uuid"
)

type ApplicationsStorage interface {
	Applications(ctx context.Context, status, userID string) ([]models.ApplicationModel, error)
	Application(ctx context.Context, id string) (*models.ApplicationModel, error)
	CreateApplication(ctx context.Context, application *models.ApplicationModel) error
	UpdateApplication(ctx context.Context, application *models.ApplicationModel) error
	DeleteApplication(ctx context.Context, application *models.ApplicationModel) error
}

type ApplicationsService struct {
	log     *slog.Logger
	storage ApplicationsStorage
}

func New(log *slog.Logger, storage ApplicationsStorage) *ApplicationsService {
	log = log.With("service", "applications")
	return &ApplicationsService{log: log, storage: storage}
}

func (s *ApplicationsService) Applications(ctx context.Context, status, userID string) ([]models.ApplicationModel, error) {
	const op = "Applications"

	log := s.log.With("op", op)
	log.Info("getting applications")

	applications, err := s.storage.Applications(ctx, status, userID)
	if err != nil {
		err = customerrors.New(err.Error(), customerrors.ErrBadRequest)
		log.Error("error getting applications", "error", err)
		return nil, err
	}

	return applications, nil
}

func (s *ApplicationsService) Application(ctx context.Context, id string) (*models.ApplicationModel, error) {
	const op = "Application"

	log := s.log.With("op", op)
	log.Info("getting application")

	application, err := s.storage.Application(ctx, id)
	if err != nil {
		err = customerrors.New(err.Error(), customerrors.ErrBadRequest)
		log.Error("error getting application", "error", err)
		return nil, err
	}

	return application, nil
}

// TODO: send notification
func (s *ApplicationsService) CreateApplication(
	ctx context.Context,
	application *requests.ApplcationRequest,
	tokenPayload *authorization.TokenPayload,
) (string, error) {
	const op = "CreateApplication"

	log := s.log.With("op", op)
	log.Info("creating application")

	applicationID := uuid.NewString()
	applicationModel := models.ApplicationModel{
		ID: applicationID,
		UserMetainfo: models.UserMetainfo{
			ID:                 tokenPayload.ID,
			Name:               tokenPayload.Name,
			Email:              tokenPayload.Email,
			ApplicationModelID: applicationID,
		},
		ApplicationStatus: models.ApplicationStatusPending,
		Ttl:               application.Ttl,
		UserRequest:       application.UserRequest,
		UserComment:       application.UserComment,
	}

	if err := s.storage.CreateApplication(ctx, &applicationModel); err != nil {
		err = customerrors.New(err.Error(), customerrors.ErrBadRequest)
		log.Error("error creating application", "error", err)
		return "", err
	}

	return applicationID, nil
}

// TODO: rewrite for policies
func (s *ApplicationsService) UpdateApplicationStatus(
	ctx context.Context,
	applicationID string,
	metainfo *requests.UpdateApplicationStatusRequest,
) error {
	const op = "UpdateApplicationStatus"

	log := s.log.With("op", op)
	log.Info("updating application status")

	application, err := s.storage.Application(ctx, applicationID)
	if err != nil {
		err = customerrors.New(err.Error(), customerrors.ErrBadRequest)
		log.Error("error getting application", "error", err)
		return err
	}

	application.ApplicationStatus = metainfo.Status
	application.AdminComment = metainfo.AdminComment

	if err := s.storage.UpdateApplication(ctx, application); err != nil {
		err = customerrors.New(err.Error(), customerrors.ErrBadRequest)
		log.Error("error updating application", "error", err)
		return err
	}

	return nil
}

func (s *ApplicationsService) DeleteApplication(ctx context.Context, applicationID string) error {
	const op = "DeleteApplication"

	log := s.log.With("op", op)
	log.Info("deleting application")

	application, err := s.storage.Application(ctx, applicationID)
	if err != nil {
		err = customerrors.New(err.Error(), customerrors.ErrBadRequest)
		log.Error("error getting application", "error", err)
		return err
	}

	if err := s.storage.DeleteApplication(ctx, application); err != nil {
		err = customerrors.New(err.Error(), customerrors.ErrBadRequest)
		log.Error("error deleting application", "error", err)
		return err
	}

	return nil
}
