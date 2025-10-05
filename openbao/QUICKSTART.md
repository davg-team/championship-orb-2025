# OpenBao - Быстрая шпаргалка

## 🚀 Dev-режим (текущая конфигурация)

**Всё работает из коробки!** Никаких действий не требуется.

```bash
docker-compose up -d
```

- ✅ Автоматически разблокирован
- ✅ Токен: `root-token-for-dev`
- ✅ Данные сохраняются в Docker volume
- ✅ Не нужна инициализация

---

## 🔒 Production режим (опционально)

Если нужна настоящая безопасность для продакшена, см. [SETUP.md](SETUP.md)

---

## 🚀 Первый запуск (только для production режима)

```bash
# 1. Запустить контейнер
docker-compose up -d openbao

# 2. Инициализировать хранилище
docker exec -it openbao bao -address http://127.0.0.1:8200 operator init

# ⚠️ ВАЖНО: Сохраните ВСЕ ключи и Root Token!
```

## 🔓 Разблокировка после перезапуска (каждый раз)

```bash
# Ручная разблокировка (нужны 3 из 5 ключей)
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal <key1>
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal <key2>
docker exec -it openbao bao -address http://127.0.0.1:8200 operator unseal <key3>

# ИЛИ использовать скрипт (после настройки .openbao-keys)
bash openbao/unseal.sh
```

## 📝 Автоматизация разблокировки

```bash
# 1. Скопировать шаблон
cp openbao/.openbao-keys.example openbao/.openbao-keys

# 2. Добавить ваши 3 ключа в файл .openbao-keys

# 3. Использовать скрипт для разблокировки
bash openbao/unseal.sh
```

## ✅ Проверка статуса

```bash
docker exec -it openbao bao -address http://127.0.0.1:8200 status

# Если "Sealed: false" - всё ОК!
```

## 🌐 Веб-интерфейс

После разблокировки доступен по адресу, настроенному в nginx (обычно через `/vault` путь)

---

## 💾 Что сохраняется

- ✅ Все секреты
- ✅ Конфигурация
- ✅ Политики доступа
- ✅ Токены

Данные хранятся в Docker volume `openbao_data` и не удаляются при перезапуске контейнера.

## ⚠️ Важные моменты

1. **НЕ ТЕРЯЙТЕ** unseal keys и root token - без них доступ к данным невозможен!
2. **НЕ КОМИТЬТЕ** файл `.openbao-keys` в git (он уже в .gitignore)
3. После каждого перезапуска Docker контейнера нужна **разблокировка**
4. Для production рекомендуется настроить auto-unseal с внешним KMS
