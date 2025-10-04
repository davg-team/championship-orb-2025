package service

import (
	"fmt"
	"net/smtp"

	"github.com/davg/backend-notifications/internal/config"
)

func SendEmail(to, subject, body string) error {
	senderCfg := config.Config().SMTP

	addr := fmt.Sprintf("%s:%v", senderCfg.Host, senderCfg.Port)

	auth := smtp.PlainAuth("", senderCfg.From, senderCfg.Password, senderCfg.Host)

	msg := []byte("To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-version: 1.0;\r\n" +
		"Content-Type: text/plain; charset=\"UTF-8\";\r\n\r\n" +
		body + "\r\n")

	return smtp.SendMail(addr, auth, senderCfg.From, []string{to}, msg)
}
