# Быстрый старт развертывания

## Подготовка

1. Убедитесь, что Docker и Docker Compose установлены
2. Клонируйте репозиторий
3. Перейдите в корневую директорию проекта

## Развертывание

### 1. Запустите все сервисы

```bash
docker-compose up -d
```

**Вот и всё!** 🎉

OpenBao автоматически инициализируется и разблокируется при первом запуске.
Все остальные сервисы также запустятся автоматически.

### 2. Получите Root Token для OpenBao (опционально)

```bash
cd openbao
chmod +x get-root-token.sh
./get-root-token.sh
```

Или вручную:
```bash
docker exec openbao cat /openbao/keys/unseal-keys.json | grep -o '"root_token":"[^"]*' | cut -d'"' -f4
```

### 3. Создайте бэкап ключей (ВАЖНО!)

```bash
cd openbao
chmod +x backup-keys.sh
./backup-keys.sh
```

Сохраните файл из `openbao/backups/` в безопасном месте!

### 4. Проверьте статус всех сервисов

```bash
docker-compose ps
```

Все сервисы должны быть в состоянии `Up`.

### 5. Доступ к сервисам

- **Frontend**: https://orencode.davg-team.ru/
- **Keycloak Admin**: https://orencode.davg-team.ru/auth/
  - Username: `admin`
  - Password: `admin45454545`
- **OpenBao UI**: https://orencode.davg-team.ru/vault/
  - Token: получите через `./openbao/get-root-token.sh`
- **RabbitMQ Management**: http://your-server:15672/
  - Username: `guest`
  - Password: `guest`

## Управление

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f nginx
docker-compose logs -f backend-notifications
docker-compose logs -f openbao
```

### Перезапуск сервисов

```bash
# Все сервисы
docker-compose restart

# Конкретный сервис
docker-compose restart nginx
```

### Остановка

```bash
docker-compose down
```

### Полная очистка (включая volumes)

```bash
docker-compose down -v
```

## После каждого перезапуска сервера

OpenBao **автоматически разблокируется** при перезапуске!

Просто запустите:
```bash
docker-compose up -d
```

Ключи хранятся в Docker volume `openbao_keys` и используются для автоматической разблокировки.

### Если автоматическая разблокировка не сработала

В редких случаях может потребоваться ручная разблокировка:

```bash
# Получить unseal keys
cd openbao
chmod +x get-unseal-keys.sh
./get-unseal-keys.sh

# Разблокировать вручную
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal
# Введите ключ 1 из списка
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal
# Введите ключ 2 из списка
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal
# Введите ключ 3 из списка
```

## Troubleshooting

### OpenBao не запускается

1. Проверьте логи: `docker-compose logs openbao`
2. Убедитесь, что порт 8200 не занят
3. Проверьте права на директории

### Backend не может подключиться к БД

1. Убедитесь, что postgres-backend запущен: `docker-compose ps postgres-backend`
2. Проверьте healthcheck: `docker inspect postgres-backend`
3. Проверьте пароль в переменных окружения

### Nginx не запускается

1. Проверьте логи: `docker-compose logs nginx`
2. Убедитесь, что все upstream сервисы запущены
3. Проверьте конфигурацию: `docker exec nginx nginx -t`

## Полезные команды

```bash
# Пересобрать контейнеры
docker-compose build --no-cache

# Запустить с пересборкой
docker-compose up -d --build

# Проверить использование ресурсов
docker stats

# Очистить неиспользуемые образы
docker system prune -a
```
