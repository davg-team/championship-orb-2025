package models

import (
	"time"

	"github.com/lib/pq"
)

const (
	ApplicationStatusPending  = "pending"
	ApplicationStatusApproved = "approved"
	ApplicationStatusDenied   = "denied"
)

type ApplicationModel struct {
	ID                string         `json:"id" gorm:"primaryKey"`
	UserMetainfo      UserMetainfo   `json:"user_metainfo" gorm:"foreignKey:ApplicationModelID;constraint:onDelete:CASCADE;"`
	ApplicationStatus string         `json:"application_status"`
	Ttl               string         `json:"ttl"`
	UserRequest       string         `json:"user_request"`
	UserComment       string         `json:"user_comment"`
	Attachments       pq.StringArray `json:"attachments" gorm:"type:text[]"`
	AdminComment      string         `json:"admin_comment"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
}

type UserMetainfo struct {
	ID                 string `json:"id"`
	ApplicationModelID string `json:"-" gorm:"primaryKey"`
	Name               string `json:"name"`
	Email              string `json:"email"`
}
