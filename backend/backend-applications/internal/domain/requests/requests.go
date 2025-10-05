package requests

type ApplcationRequest struct {
	Ttl         string   `json:"ttl"`
	UserRequest string   `json:"user_request"`
	UserComment string   `json:"user_comment"`
	Attachments []string `json:"attachments"`
}

type ApproveApplicationRequest struct {
	AdminComment string `json:"admin_comment"`
	ApproveType  string `json:"approve_type"`

	// Добавить сущ. политику к пользователю
	ExistingPolicies []string `json:"existing_policies"`

	// Создать новую политику
	NewPolicy PolicyModel `json:"new_policy"`

	// Добавить секреты в персональную политику
	PersonalPolicySecrets []string `json:"personal_policy_secrets"`
}

type PolicyModel struct {
	Title   string   `json:"title"`
	Secrets []string `json:"secrets"`
}
