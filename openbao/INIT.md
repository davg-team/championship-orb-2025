# Инициализация OpenBao

## Первый запуск

1. **Запустите контейнер:**
```bash
docker-compose up -d openbao
```

2. **Инициализируйте OpenBao:**
```bash
docker exec -it openbao bao operator init -address http://127.0.0.1:8200
```

Эта команда вернет:
- **5 Unseal Keys** - ключи для разблокировки (нужно минимум 3 для разблокировки)
- **Initial Root Token** - токен для первого входа

**⚠️ ВАЖНО:** Сохраните эти ключи в безопасном месте! Без них вы не сможете разблокировать OpenBao после перезапуска.

Пример вывода:
```
Unseal Key 1: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Unseal Key 2: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Unseal Key 3: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Unseal Key 4: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Unseal Key 5: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Initial Root Token: hvs.xxxxxxxxxxxxxxxxxxxxx
```

3. **Создайте файл с ключами для автоматической разблокировки:**
```bash
cd openbao
nano .openbao-keys
```

Добавьте первые 3 unseal keys (по одному на строку):
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Сохраните файл (Ctrl+O, Enter, Ctrl+X в nano).

4. **Разблокируйте OpenBao:**
```bash
./unseal.sh
```

Или вручную (3 раза):
```bash
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal
# Введите первый ключ
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal
# Введите второй ключ
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal
# Введите третий ключ
```

5. **Проверьте статус:**
```bash
docker exec -it openbao bao -address http://127.0.0.1:8200 status
```

Вы должны увидеть `Sealed: false`

6. **Войдите в UI:**
- Откройте https://orencode.davg-team.ru/vault/
- Введите **Initial Root Token**

## После каждого перезапуска контейнера

OpenBao будет "запечатан" (sealed) после перезапуска. Чтобы разблокировать:

```bash
cd openbao
./unseal.sh
```

Или используйте UI: откройте https://orencode.davg-team.ru/vault/ и введите 3 unseal keys.

## Важные замечания

1. **Не коммитьте .openbao-keys в Git!** (уже добавлен в .gitignore)
2. Храните unseal keys и root token в безопасном месте (например, в password manager)
3. Для production рекомендуется использовать автоматическую разблокировку через cloud KMS
4. Данные хранятся в Docker volume `openbao_data` и переживут перезапуск контейнера
