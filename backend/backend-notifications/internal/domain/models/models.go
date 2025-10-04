package models

type Notification struct {
	ID      string  `json:"id" gorm:"primaryKey"`
	UserID  string  `json:"user_id"`
	Subject string  `json:"subject"`
	Body    string  `json:"body"`
	Custom  JSONMap `json:"custom" gorm:"type:jsonb"`
	IsNew   bool    `json:"is_new"`
}
