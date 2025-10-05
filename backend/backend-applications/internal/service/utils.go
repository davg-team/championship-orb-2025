package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/davg/backend-applications/internal/config"
	"github.com/davg/backend-applications/internal/domain/requests"
)

func UpdateUserPolicy(ctx context.Context, metainfo *requests.ApproveApplicationRequest, userID string) error {
	userEntityID, userPolicies, err := getEntityIDAndPolicies(userID)
	if err != nil {
		return err
	}
	switch metainfo.ApproveType {
	case "new_policy":
		err = createNewPolicy(metainfo.NewPolicy.Title, metainfo.NewPolicy.Secrets, userEntityID, userPolicies)
		if err != nil {
			return err
		}
	case "existing_policy":
		fmt.Println(userEntityID)
		err = assignPolicy(userEntityID, metainfo.ExistingPolicies, userPolicies)
		if err != nil {
			return err
		}
	case "personal_policy":
		err = updatePersonalPolicy(userEntityID, metainfo.PersonalPolicySecrets, userPolicies)
		if err != nil {
			return err
		}
	}
	return nil
}

func getEntityIDAndPolicies(userID string) (string, []string, error) {
	cfg := config.Config().OpenBao
	url := fmt.Sprintf("%s/identity/lookup/entity", cfg.URL)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(fmt.Appendf(nil, `{"alias_name": "%s", "alias_mount_accessor": "auth_jwt_d9bb0d70"}`, userID)))
	if err != nil {
		return "", nil, err
	}

	req.Header.Set("X-Vault-Token", cfg.RootToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", nil, fmt.Errorf("failed to get entity id: %s", resp.Status)
	}

	var response struct {
		Data struct {
			Aliases []struct {
				CanonicalID string `json:"canonical_id"`
			}
			Policies []string `json:"policies"`
		}
	}
	err = json.NewDecoder(resp.Body).Decode(&response)
	if err != nil {
		return "", nil, err
	}
	canonicalID := response.Data.Aliases[0].CanonicalID

	return canonicalID, response.Data.Policies, nil
}

func assignPolicy(entityID string, policies []string, currentPolicies []string) error {
	cfg := config.Config().OpenBao
	url := fmt.Sprintf("%s/identity/entity/id/%s", cfg.URL, entityID)
	combinedPolicies := append(currentPolicies, policies...)
	sort.Strings(combinedPolicies)
	type request struct {
		Policies []string `json:"policies"`
	}

	body, err := json.Marshal(request{Policies: combinedPolicies})
	if err != nil {
		return err
	}
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	req.Header.Set("X-Vault-Token", cfg.RootToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 204 && resp.StatusCode != 200 {
		return fmt.Errorf("failed to assign policy: %s", resp.Status)
	}
	return nil
}

func createNewPolicy(policyTitle string, secrets []string, entityID string, policies []string) error {
	cfg := config.Config().OpenBao
	url := fmt.Sprintf("%s/sys/policies/acl/%s", cfg.URL, policyTitle)

	// Формируем HCL политику
	var policyBuilder strings.Builder
	policyBuilder.WriteString(fmt.Sprintf("# Policy: %s\n", policyTitle))
	policyBuilder.WriteString("# Auto-generated policy with read-only access\n\n")

	for _, secret := range secrets {
		policyBuilder.WriteString(fmt.Sprintf("# Access to %s\n", secret))
		policyBuilder.WriteString(fmt.Sprintf("path \"kv/data/%s\" {\n", secret))
		policyBuilder.WriteString("  capabilities = [\"read\"]\n")
		policyBuilder.WriteString("}\n\n")
	}

	// Добавляем доступ к метаданным для listing
	policyBuilder.WriteString("# Metadata access for listing\n")
	policyBuilder.WriteString("path \"kv/metadata/*\" {\n")
	policyBuilder.WriteString("  capabilities = [\"list\"]\n")
	policyBuilder.WriteString("}\n")

	// Формируем JSON body
	body := map[string]string{
		"policy": policyBuilder.String(),
	}

	fmt.Println(body)

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("failed to marshal policy: %w", err)
	}

	// Создаем HTTP запрос
	req, err := http.NewRequest("PUT", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("X-Vault-Token", cfg.RootToken)
	req.Header.Set("Content-Type", "application/json")

	// Выполняем запрос
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to create policy: status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	err = assignPolicy(entityID, []string{policyTitle}, policies)
	if err != nil {
		return fmt.Errorf("failed to assign policy: %w", err)
	}

	return nil
}

func updatePersonalPolicy(userEntityID string, secrets []string, policies []string) error {
	cfg := config.Config().OpenBao
	policyName := fmt.Sprintf("personal_%s", userEntityID)
	url := fmt.Sprintf("%s/sys/policies/acl/%s", cfg.URL, policyName)

	// 1. Получаем существующую политику
	existingSecrets, err := getExistingSecrets(url, cfg.RootToken)
	if err != nil && !isNotFoundError(err) {
		return fmt.Errorf("failed to get existing policy: %w", err)
	}

	// 2. Объединяем старые и новые секреты (убираем дубликаты)
	secretsMap := make(map[string]bool)

	// Добавляем существующие
	for _, secret := range existingSecrets {
		secretsMap[secret] = true
	}

	// Добавляем новые
	for _, secret := range secrets {
		secretsMap[secret] = true
	}

	// Преобразуем обратно в слайс
	allSecrets := make([]string, 0, len(secretsMap))
	for secret := range secretsMap {
		allSecrets = append(allSecrets, secret)
	}

	// Сортируем для предсказуемости
	sort.Strings(allSecrets)

	// 3. Формируем обновленную политику
	var policyBuilder strings.Builder
	policyBuilder.WriteString(fmt.Sprintf("# Personal Policy for user: %s\n", userEntityID))
	policyBuilder.WriteString(fmt.Sprintf("# Total secrets: %d\n", len(allSecrets)))
	policyBuilder.WriteString("# Auto-generated and auto-updated\n\n")

	for _, secret := range allSecrets {
		policyBuilder.WriteString(fmt.Sprintf("# Access to %s\n", secret))
		policyBuilder.WriteString(fmt.Sprintf("path \"kv/data/%s\" {\n", secret))
		policyBuilder.WriteString("  capabilities = [\"read\"]\n")
		policyBuilder.WriteString("}\n\n")
	}

	// Метаданные
	policyBuilder.WriteString("# Metadata access for listing\n")
	policyBuilder.WriteString("path \"kv/metadata/*\" {\n")
	policyBuilder.WriteString("  capabilities = [\"list\"]\n")
	policyBuilder.WriteString("}\n")

	// 4. Сохраняем политику
	body := map[string]string{
		"policy": policyBuilder.String(),
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("failed to marshal policy: %w", err)
	}

	req, err := http.NewRequest("PUT", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("X-Vault-Token", cfg.RootToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to update policy: status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	err = assignPolicy(userEntityID, []string{policyName}, policies)
	if err != nil {
		return fmt.Errorf("failed to assign policy: %w", err)
	}

	// 5. Логируем
	if len(existingSecrets) > 0 {
		log.Printf("Updated policy for user %s: %d existing + %d new = %d total secrets",
			userEntityID, len(existingSecrets), len(secrets), len(allSecrets))
	} else {
		log.Printf("Created new policy for user %s with %d secrets", userEntityID, len(allSecrets))
	}

	return nil
}

// Парсинг существующей политики для извлечения путей к секретам
func getExistingSecrets(url, token string) ([]string, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("X-Vault-Token", token)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("policy not found")
	}

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get policy: status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	var response struct {
		Data struct {
			Policy string `json:"policy"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Парсим HCL политику для извлечения путей
	return parseSecretsFromPolicy(response.Data.Policy), nil
}

// Извлекает пути секретов из HCL политики
func parseSecretsFromPolicy(policyHCL string) []string {
	var secrets []string

	// Регулярное выражение для поиска путей вида: path "kv/data/..."
	re := regexp.MustCompile(`path\s+"kv/data/([^"]+)"`)
	matches := re.FindAllStringSubmatch(policyHCL, -1)

	for _, match := range matches {
		if len(match) > 1 {
			secrets = append(secrets, match[1])
		}
	}

	return secrets
}

// Проверка на "не найдено"
func isNotFoundError(err error) bool {
	return err != nil && (err.Error() == "policy not found" ||
		strings.Contains(err.Error(), "404") ||
		strings.Contains(err.Error(), "not found"))
}

func SendEmail(to []string, subject string, body string) error {
	url := config.Config().Notifications.URL + "/smartsend"

	type request struct {
		UserIDs []string `json:"user_ids"`
		Title   string   `json:"title"`
		Body    string   `json:"body"`
	}

	jsonBody, err := json.Marshal(request{UserIDs: to, Title: subject, Body: body})
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("failed to send email: %s", resp.Status)
	}
	return nil
}

// func SendPush(to string)
