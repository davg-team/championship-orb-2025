package queue

import (
	"fmt"
	"log/slog"

	amqp "github.com/rabbitmq/amqp091-go"
)

type RabbitMQ struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	queue   amqp.Queue
}

func NewRabbitMQ(url, queueName string) (*RabbitMQ, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}

	q, err := ch.QueueDeclare(
		queueName,
		true,  // durable
		false, // auto-delete
		false, // exclusive
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		return nil, err
	}

	return &RabbitMQ{conn: conn, channel: ch, queue: q}, nil
}

func (r *RabbitMQ) Publish(body []byte) error {
	return r.channel.Publish(
		"",           // exchange
		r.queue.Name, // routing key
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
}

func (r *RabbitMQ) Consume(handler func([]byte) error) error {
	msgs, err := r.channel.Consume(
		r.queue.Name,
		"",    // consumer tag
		false, // auto-ack
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}

	slog.Info("Started consuming messages from queue", slog.String("queue", r.queue.Name))

	// Бесконечный цикл обработки сообщений
	for msg := range msgs {
		slog.Debug("Received message", slog.String("queue", r.queue.Name))

		if err := handler(msg.Body); err != nil {
			slog.Error("Failed to process message", "error", err)
			// Возвращаем в очередь для повторной обработки
			msg.Nack(false, true)
		} else {
			// Подтверждаем успешную обработку
			msg.Ack(false)
		}
	}

	// Если цикл завершился - канал закрыт
	slog.Warn("Message channel closed")
	return nil
}

func (r *RabbitMQ) Close() error {
	return r.conn.Close()
}
