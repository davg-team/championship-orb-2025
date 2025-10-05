#!/bin/sh
set -e

# Устанавливаем адрес OpenBao API
export BAO_ADDR=http://localhost:8200

# Директория для хранения ключей
KEYS_DIR="/openbao/keys"
KEYS_LOGS="/openbao/logs"
KEYS_FILE="${KEYS_DIR}/unseal-keys.json"
# KEYS_FILE="${KEYS_LOGS}/audit.log"
INIT_FLAG="${KEYS_DIR}/.initialized"

# Создаем директорию для ключей если её нет
mkdir -p "${KEYS_DIR}"
mkdir -p "${KEYS_LOGS}"

# Функция для проверки статуса OpenBao
check_vault_status() {
    wget --spider --proxy off -q http://localhost:8200/v1/sys/health 2>/dev/null
    return $?
}

# Запускаем сервер в фоне
echo "Starting OpenBao server..."
bao server -config=/openbao/config/config.hcl &
SERVER_PID=$!

# Ждем запуска сервера
echo "Waiting for OpenBao to start..."
for i in $(seq 10 ); do
    if check_vault_status; then
        echo "OpenBao is up!"
        break
    fi
    echo "Waiting... ($i/10)"
    sleep 1
done

# Проверяем, нужна ли инициализация
if [ ! -f "${INIT_FLAG}" ]; then
    echo "First run detected. Initializing OpenBao..."
    
    # Инициализируем OpenBao
    INIT_OUTPUT=$(bao operator init -key-shares=5 -key-threshold=3 -format=json)
    
    if [ $? -eq 0 ]; then
        echo "${INIT_OUTPUT}" > "${KEYS_FILE}"
        echo "OpenBao initialized successfully!"
        echo "Keys saved to: ${KEYS_FILE}"
        
        # Создаем флаг инициализации
        touch "${INIT_FLAG}"
        
        # Выводим важную информацию в логи
        echo "=========================================="
        echo "IMPORTANT: OpenBao has been initialized!"
        echo "Root Token and Unseal Keys are stored in:"
        echo "${KEYS_FILE}"
        echo "=========================================="
        echo ""
        echo "Root Token: $(echo "${INIT_OUTPUT}" | grep -o '"root_token":"[^"]*' | cut -d'"' -f4)"
        echo ""
        echo "PLEASE BACKUP THESE CREDENTIALS!"
        echo "=========================================="
    else
        echo "Failed to initialize OpenBao"
        kill ${SERVER_PID}
        exit 1
    fi
else
    echo "OpenBao already initialized"
fi

# Автоматическая разблокировка
echo "Unsealing OpenBao..."

if [ -f "${KEYS_FILE}" ]; then
    # Извлекаем первые 3 ключа из JSON
    UNSEAL_KEY_1=$(grep -Eo '[0-9a-f]{32,}' "${KEYS_FILE}" | sed -n '1p')
    UNSEAL_KEY_2=$(grep -Eo '[0-9a-f]{32,}' "${KEYS_FILE}" | sed -n '2p')
    UNSEAL_KEY_3=$(grep -Eo '[0-9a-f]{32,}' "${KEYS_FILE}" | sed -n '3p')

    if [ -n "${UNSEAL_KEY_1}" ] && [ -n "${UNSEAL_KEY_2}" ] && [ -n "${UNSEAL_KEY_3}" ]; then
        echo "Applying unseal key 1..."
        bao operator unseal "${UNSEAL_KEY_1}" > /dev/null 2>&1

        echo "Applying unseal key 2..."
        bao operator unseal "${UNSEAL_KEY_2}" > /dev/null 2>&1

        echo "Applying unseal key 3..."
        bao operator unseal "${UNSEAL_KEY_3}" > /dev/null 2>&1

        echo "OpenBao unsealed successfully!"
    else
        echo "ERROR: Could not extract unseal keys from ${KEYS_FILE}"
        echo "Manual unsealing required"
    fi
else
    echo "WARNING: Keys file not found: ${KEYS_FILE}"
    echo "Manual unsealing required"
fi


# Проверяем статус
echo "Checking OpenBao status..."
bao status || true

echo "OpenBao is ready!"

# Держим процесс живым
wait ${SERVER_PID}
