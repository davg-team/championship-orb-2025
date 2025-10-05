# Настройка OpenBao

## Первоначальная инициализация

После первого запуска OpenBao в production режиме необходимо выполнить инициализацию:

### 1. Запустите контейнер
```bash
docker-compose up -d openbao
```

### 2. Инициализируйте OpenBao
```bash
docker exec -it openbao bao -address http://127.0.0.1:8200 operator init
```

Эта команда выведет:
- **5 Unseal Keys** - ключи для разблокировки хранилища
- **Initial Root Token** - корневой токен для доступа

**ВАЖНО:** Сохраните все ключи и токен в безопасном месте! Без них вы не сможете получить доступ к данным.

### 3. Разблокируйте хранилище (unseal)

После каждого перезапуска контейнера необходимо разблокировать хранилище, используя 3 из 5 ключей:

```bash
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal <key1>
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal <key2>
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal <key3>
```

### 4. Проверьте статус
```bash
docker exec -it openbao bao -address http://127.0.0.1:8200 status
```

Если `Sealed: false`, значит хранилище разблокировано и готово к работе.

## Автоматическая разблокировка (опционально)

Для автоматической разблокировки можно использовать auto-unseal с помощью внешних KMS сервисов, но это требует дополнительной настройки.

## Использование

После разблокировки используйте Root Token для доступа к веб-интерфейсу или API:

```bash
export OPENBAO_ADDR='http://localhost:8200'
export OPENBAO_TOKEN='<your-root-token>'
docker exec -it openbao bao -address http://127.0.0.1:8200 secrets list
```
