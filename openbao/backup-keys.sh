#!/bin/bash

# Скрипт для бэкапа ключей OpenBao
# ВАЖНО: Храните бэкап в безопасном месте!

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/openbao-keys-${TIMESTAMP}.json"

# Создаем директорию для бэкапов
mkdir -p "${BACKUP_DIR}"

echo "Creating backup of OpenBao keys..."
echo ""

# Проверяем, запущен ли контейнер
if ! docker ps | grep -q openbao; then
    echo "ERROR: OpenBao container is not running!"
    echo "Start it with: docker-compose up -d openbao"
    exit 1
fi

# Копируем файл с ключами
docker exec openbao cat /openbao/keys/unseal-keys.json > "${BACKUP_FILE}" 2>/dev/null

if [ $? -eq 0 ] && [ -s "${BACKUP_FILE}" ]; then
    echo "✓ Backup created successfully!"
    echo ""
    echo "Location: ${BACKUP_FILE}"
    echo "Size: $(du -h "${BACKUP_FILE}" | cut -f1)"
    echo ""
    echo "=========================================="
    echo "WARNING: This file contains sensitive data!"
    echo "- Store it in a secure location"
    echo "- Consider encrypting it"
    echo "- Do NOT commit it to Git"
    echo "=========================================="
    echo ""
    
    # Устанавливаем права доступа
    chmod 600 "${BACKUP_FILE}"
    echo "✓ File permissions set to 600 (owner read/write only)"
else
    echo "ERROR: Failed to create backup"
    rm -f "${BACKUP_FILE}"
    exit 1
fi
