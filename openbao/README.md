# OpenBao - Автоматическая настройка

## Что происходит автоматически

При первом запуске `docker-compose up -d`:

1. ✅ OpenBao автоматически инициализируется
2. ✅ Создаются 5 unseal keys и root token
3. ✅ Ключи сохраняются в Docker volume `openbao_keys`
4. ✅ OpenBao автоматически разблокируется при старте
5. ✅ При перезапуске контейнера разблокировка происходит автоматически

**Никаких ручных действий не требуется!** 🎉

## Полезные скрипты

### Получить Root Token

```bash
chmod +x get-root-token.sh
./get-root-token.sh
```

Используйте этот token для входа в UI: https://orencode.davg-team.ru/vault/

### Получить Unseal Keys

```bash
chmod +x get-unseal-keys.sh
./get-unseal-keys.sh
```

Эти ключи нужны только для аварийной ручной разблокировки.

### Создать бэкап ключей (ВАЖНО!)

```bash
chmod +x backup-keys.sh
./backup-keys.sh
```

Файл будет сохранен в `backups/openbao-keys-TIMESTAMP.json`

**⚠️ ХРАНИТЕ БЭКАП В БЕЗОПАСНОМ МЕСТЕ!**

## Структура

```
openbao/
├── config/
│   └── config.hcl          # Конфигурация OpenBao
├── Dockerfile              # Кастомный образ с автоматизацией
├── entrypoint.sh           # Скрипт автоматической инициализации
├── get-root-token.sh       # Получить root token
├── get-unseal-keys.sh      # Получить unseal keys
├── backup-keys.sh          # Создать бэкап ключей
├── unseal.sh               # Устаревший скрипт (не нужен)
└── backups/                # Бэкапы ключей (создается автоматически)
```

## Где хранятся ключи

Ключи безопасно хранятся в Docker volumes:

- `openbao_data` - данные OpenBao (секреты, политики и т.д.)
- `openbao_keys` - unseal keys и root token
- `openbao_logs` - логи

Volumes не удаляются при `docker-compose down`, только при `docker-compose down -v`.

## Безопасность

### ⚠️ ВАЖНО для production:

1. **Сделайте бэкап ключей:**
   ```bash
   ./backup-keys.sh
   ```
   Сохраните файл в безопасном месте (password manager, зашифрованное хранилище)

2. **Ограничьте доступ к серверу:**
   - Настройте firewall
   - Используйте VPN для доступа к OpenBao
   - Регулярно обновляйте пароли

3. **Мониторинг:**
   ```bash
   docker-compose logs -f openbao
   ```

4. **Ротация токенов:**
   - Root token следует использовать только для начальной настройки
   - Создайте отдельные токены с ограниченными правами для приложений

## Troubleshooting

### OpenBao не разблокировается автоматически

Проверьте логи:
```bash
docker-compose logs openbao
```

Разблокируйте вручную:
```bash
./get-unseal-keys.sh
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal
# Введите 3 любых ключа из списка
```

### Потерян Root Token

```bash
./get-root-token.sh
```

### Потеряны Unseal Keys

Если у вас есть бэкап:
```bash
cat backups/openbao-keys-*.json
```

Если нет бэкапа и OpenBao запечатан - **данные восстановить невозможно**. 
Придется переинициализировать (все секреты будут потеряны):
```bash
docker-compose down -v
docker-compose up -d
```

## Ручная инициализация (если нужно)

Обычно не требуется, но если хотите переинициализировать:

```bash
# Остановить и удалить volume с ключами
docker-compose down
docker volume rm championship-orb-2025-private_openbao_keys

# Запустить заново
docker-compose up -d
```

OpenBao автоматически инициализируется заново с новыми ключами.
