#!/bin/bash

# Скрипт для разблокировки OpenBao
# Сохраните ваши unseal keys в файле .openbao-keys (по одному на строку)
# НЕ КОМИТЬТЕ ЭТОТ ФАЙЛ В GIT!

KEYS_FILE="$(dirname "$0")/.openbao-keys"

if [ ! -f "$KEYS_FILE" ]; then
    echo "Файл с ключами не найден: $KEYS_FILE"
    echo "Создайте файл и добавьте 3 unseal key (по одному на строку)"
    exit 1
fi

echo "Разблокировка OpenBao..."

# Читаем первые 3 ключа
count=0
while IFS= read -r key && [ $count -lt 3 ]; do
    if [ -n "$key" ]; then
        echo "Используем ключ $(($count + 1))..."
        docker exec -it openbao bao operator unseal "$key"
        count=$((count + 1))
    fi
done < "$KEYS_FILE"

if [ $count -lt 3 ]; then
    echo "ОШИБКА: Недостаточно ключей в файле (найдено: $count, требуется: 3)"
    exit 1
fi

echo ""
echo "Проверка статуса..."
docker exec -it openbao bao status

echo ""
echo "Готово! OpenBao разблокирован."
