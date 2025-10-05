# Автоматизация OpenBao - Резюме изменений

## Что было сделано

Полностью автоматизирован процесс развертывания OpenBao. Теперь для запуска всего проекта достаточно одной команды: `docker-compose up -d`

## Основные изменения

### 1. Создан кастомный Docker образ для OpenBao

**Файл:** `openbao/Dockerfile`
- Базируется на официальном образе `openbao/openbao:latest`
- Добавлены утилиты для автоматизации (bash, grep, sed, coreutils)
- Встроен автоматический entrypoint скрипт

### 2. Создан entrypoint скрипт для автоматической инициализации

**Файл:** `openbao/entrypoint.sh`

**Функционал:**
- ✅ Автоматически запускает OpenBao сервер
- ✅ Проверяет, инициализирован ли OpenBao (через флаг `.initialized`)
- ✅ При первом запуске:
  - Инициализирует OpenBao (5 unseal keys, порог 3)
  - Сохраняет ключи в JSON формате в `/openbao/keys/unseal-keys.json`
  - Выводит root token в логи
  - Создает флаг инициализации
- ✅ Автоматически разблокирует OpenBao при каждом запуске:
  - Извлекает первые 3 unseal keys из JSON
  - Применяет их для разблокировки
- ✅ Проверяет статус и держит процесс живым

### 3. Обновлен docker-compose.yml

**Изменения в сервисе openbao:**
```yaml
- image: openbao/openbao:latest          # Было
+ build: context: ./openbao              # Стало (кастомный образ)

- command: server -dev                   # Убран dev-режим
+ entrypoint через Dockerfile            # Автоматический entrypoint

+ volumes:
+   - openbao_keys:/openbao/keys        # Новый volume для ключей

+ restart: unless-stopped                # Автоперезапуск
+ start_period: 30s                      # Увеличено время для инициализации
```

**Добавлен новый volume:**
```yaml
volumes:
  openbao_keys:  # Для хранения unseal keys и root token
```

### 4. Созданы утилиты для управления

**Скрипты в директории `openbao/`:**

1. **`get-root-token.sh`** - Получить root token
   ```bash
   ./get-root-token.sh
   ```

2. **`get-unseal-keys.sh`** - Получить все unseal keys
   ```bash
   ./get-unseal-keys.sh
   ```

3. **`backup-keys.sh`** - Создать бэкап ключей
   ```bash
   ./backup-keys.sh
   ```
   Сохраняет файл в `backups/openbao-keys-TIMESTAMP.json`

### 5. Обновлена документация

**Новые файлы:**
- `openbao/README.md` - Полное руководство по автоматической настройке
- `DEPLOYMENT.md` - Обновлено с учетом автоматизации
- `README.md` - Обновлен раздел "Запуск проекта"

**Обновлен `.gitignore`:**
```gitignore
# Защита от случайного коммита ключей
unseal-keys.json
backups/
keys/
```

## Как это работает

### Первый запуск (холодный старт)

```bash
docker-compose up -d
```

**Что происходит автоматически:**
1. Docker собирает кастомный образ OpenBao (если еще не собран)
2. Запускается контейнер с entrypoint.sh
3. OpenBao инициализируется (создаются ключи)
4. Ключи сохраняются в Docker volume `openbao_keys`
5. OpenBao автоматически разблокируется
6. Root token выводится в логи: `docker-compose logs openbao`

### Последующие запуски

```bash
docker-compose up -d
# или
docker-compose restart openbao
```

**Что происходит:**
1. OpenBao запускается
2. Entrypoint обнаруживает флаг `.initialized`
3. Автоматически извлекает unseal keys из volume
4. Разблокирует OpenBao
5. Готов к работе!

## Преимущества

✅ **Zero manual configuration** - никаких ручных действий не требуется
✅ **Persistent storage** - ключи и данные сохраняются в Docker volumes
✅ **Auto-unseal** - автоматическая разблокировка при каждом перезапуске
✅ **Secure by default** - ключи хранятся внутри volume, не в файловой системе хоста
✅ **Easy backup** - простой скрипт для бэкапа ключей
✅ **Production-ready** - использует production конфигурацию (не dev режим)

## Безопасность

### Где хранятся ключи

- **В Docker volume `openbao_keys`** - изолированное хранилище
- Ключи НЕ хранятся в файловой системе хоста (если не делать бэкап)
- Volume не удаляется при `docker-compose down`
- Удаляется только при `docker-compose down -v` (явное удаление volumes)

### Рекомендации для production

1. **Сделайте бэкап ключей сразу после первого запуска:**
   ```bash
   cd openbao
   ./backup-keys.sh
   ```
   Сохраните файл в безопасном месте (password manager, encrypted storage)

2. **Ограничьте доступ к серверу:**
   - Firewall
   - VPN
   - Сетевая изоляция

3. **Регулярный мониторинг:**
   ```bash
   docker-compose logs -f openbao
   ```

4. **Ротация токенов:**
   - Root token используйте только для начальной настройки
   - Создавайте отдельные токены с ограниченными правами

## Миграция со старой конфигурации

Если у вас была ручная настройка:

```bash
# 1. Остановить контейнеры
docker-compose down

# 2. (Опционально) Удалить старые volumes если хотите начать с нуля
docker volume rm championship-orb-2025-private_openbao_data
docker volume rm championship-orb-2025-private_openbao_logs

# 3. Запустить с новой конфигурацией
docker-compose up -d

# 4. Получить новый root token
cd openbao
./get-root-token.sh

# 5. Сделать бэкап ключей
./backup-keys.sh
```

## Troubleshooting

### Проверить статус инициализации

```bash
docker-compose logs openbao | grep "initialized"
```

### Посмотреть root token в логах

```bash
docker-compose logs openbao | grep "Root Token"
```

### Вручную извлечь ключи из volume

```bash
docker exec openbao cat /openbao/keys/unseal-keys.json
```

### Переинициализировать OpenBao

```bash
docker-compose down
docker volume rm championship-orb-2025-private_openbao_keys
docker volume rm championship-orb-2025-private_openbao_data
docker-compose up -d
```

## Итог

**До:**
```bash
docker-compose up -d
docker exec -it openbao bao -address http://127.0.0.1:8200 operator init
# Сохранить ключи вручную
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal  # x3
# При каждом перезапуске - разблокировка вручную
```

**После:**
```bash
docker-compose up -d
# Готово! 🎉
```

Все остальное происходит автоматически!
