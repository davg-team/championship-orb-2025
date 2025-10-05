#!/bin/bash

# Скрипт для получения всех Unseal Keys из OpenBao

echo "Extracting Unseal Keys from OpenBao..."
echo ""

# Проверяем, запущен ли контейнер
if ! docker ps | grep -q openbao; then
    echo "ERROR: OpenBao container is not running!"
    echo "Start it with: docker-compose up -d openbao"
    exit 1
fi

# Извлекаем ключи
echo "=========================================="
echo "OpenBao Unseal Keys:"
echo ""

docker exec openbao cat /openbao/keys/unseal-keys.json \
  | grep -Eo '[0-9a-f]{32,}' \
  | nl -w1 -s'. '

if [ $? -ne 0 ]; then
    echo "ERROR: Could not extract Unseal Keys"
    echo "OpenBao might not be initialized yet"
    echo ""
    echo "Check logs with: docker-compose logs openbao"
    exit 1
fi

echo ""
echo "=========================================="
echo ""
echo "You need at least 3 of these keys to unseal OpenBao"
echo "after a restart (if auto-unseal fails)"
echo ""
