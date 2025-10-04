package request

type SendSMTP struct {
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

type CreateNotification struct {
	UserID  string            `json:"user_id"`
	Subject string            `json:"subject"`
	Body    string            `json:"body"`
	Custom  map[string]string `json:"custom"`
	IsNew   bool              `json:"is_new"`
}
