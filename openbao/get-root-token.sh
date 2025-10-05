#!/bin/bash

# Скрипт для получения Root Token из OpenBao

echo "Extracting Root Token from OpenBao..."
echo ""

# Проверяем, запущен ли контейнер
if ! docker ps | grep -q openbao; then
    echo "ERROR: OpenBao container is not running!"
    echo "Start it with: docker-compose up -d openbao"
    exit 1
fi

# Извлекаем Root Token
ROOT_TOKEN=$(docker exec openbao cat /openbao/keys/unseal-keys.json 2>/dev/null | grep -o '"root_token":"[^"]*' | cut -d'"' -f4)

if [ -z "${ROOT_TOKEN}" ]; then
    echo "ERROR: Could not extract Root Token"
    echo "OpenBao might not be initialized yet"
    echo ""
    echo "Check logs with: docker-compose logs openbao"
    exit 1
fi

echo "=========================================="
echo "OpenBao Root Token:"
echo ""
echo "${ROOT_TOKEN}"
echo ""
echo "=========================================="
echo ""
echo "Use this token to login to OpenBao UI:"
echo "https://orencode.davg-team.ru/vault/"
echo ""
echo "To copy to clipboard (Linux):"
echo "echo '${ROOT_TOKEN}' | xclip -selection clipboard"
echo ""
echo "To copy to clipboard (macOS):"
echo "echo '${ROOT_TOKEN}' | pbcopy"
echo ""
