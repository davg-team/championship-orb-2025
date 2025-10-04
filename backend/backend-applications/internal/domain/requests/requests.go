package requests

type ApplcationRequest struct {
	Ttl         string `json:"ttl"`
	UserRequest string `json:"user_request"`
	UserComment string `json:"user_comment"`
}

type UpdateApplicationStatusRequest struct {
	Status       string `json:"status"`
	AdminComment string `json:"admin_comment"`
}
