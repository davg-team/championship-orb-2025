package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/smtp"
	"net/url"
	"strings"
	"time"

	"github.com/davg/backend-notifications/internal/config"
)

func SendEmail(ctx context.Context, to, subject, body string) error {
	senderCfg := config.Config().SMTP
	addr := fmt.Sprintf("%s:%v", senderCfg.Host, senderCfg.Port)

	auth := smtp.PlainAuth("", senderCfg.Username, senderCfg.Password, senderCfg.Host)

	// Кодируем тему в base64 (RFC 2047)
	encodedSubject := fmt.Sprintf("=?UTF-8?B?%s?=", encodeBase64(subject))

	msg := strings.Join([]string{
		fmt.Sprintf("From: %s", senderCfg.From),
		fmt.Sprintf("To: %s", to),
		fmt.Sprintf("Subject: %s", encodedSubject),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=\"UTF-8\"",
		"",
		body,
	}, "\r\n")

	if ctx.Err() != nil {
		return ctx.Err()
	}

	return smtp.SendMail(addr, auth, senderCfg.From, []string{to}, []byte(msg))
}

// Вспомогательная функция для кодирования темы
func encodeBase64(s string) string {
	return strings.TrimRight(
		// импортируй encoding/base64
		base64.StdEncoding.EncodeToString([]byte(s)),
		"\r\n",
	)
}

func SendRequest(method, url string, data interface{}, headers map[string]string) (map[string]interface{}, int, error) {
	var result map[string]interface{}
	var body []byte

	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			return nil, 0, err
		}
		body = jsonData
	}

	client := &http.Client{Timeout: 10 * time.Second}

	req, err := http.NewRequest(method, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, 0, err
	}

	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, resp.StatusCode, err
	}

	return result, resp.StatusCode, nil
}

func SendTelegramMessage(ChatID int, Title, Body string) error {
	cfg := config.Config().Telegram
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", cfg.Token)

	text := fmt.Sprintf("%s\n\n%s", Title, Body)

	payload := map[string]interface{}{
		"chat_id":    ChatID,
		"text":       text,
		"parse_mode": "HTML",
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to send telegram message: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram API returned non-OK status: %s", resp.Status)
	}

	return nil
}

func GetAuthToken() (string, error) {
	tokenURL := "https://orencode.davg-team.ru/auth/realms/secretmanager/protocol/openid-connect/token"

	form := url.Values{}
	form.Add("client_id", "backend")
	form.Add("client_secret", "uaDG6WC10jSXy0weNLC6nmxgV7asA8wM")
	form.Add("grant_type", "client_credentials")

	req, err := http.NewRequest("POST", tokenURL, bytes.NewBufferString(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("unexpected status %d: %v", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %v", err)
	}

	token, ok := result["access_token"].(string)
	if !ok {
		return "", fmt.Errorf("access_token not found in response")
	}

	return token, nil
}

func GetUser(token, userID string) (map[string]interface{}, error) {
	url := fmt.Sprintf("https://orencode.davg-team.ru/auth/admin/realms/secretmanager/users/%s", userID)

	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", token),
	}

	resp, status, err := SendRequest("GET", url, nil, headers)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %v", err)
	}

	if status != 200 {
		return nil, fmt.Errorf("unexpected status %d: %v", status, resp)
	}

	return resp, nil
}
