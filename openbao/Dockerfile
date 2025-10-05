FROM openbao/openbao:latest

# Устанавливаем необходимые утилиты
USER root
RUN apk add --no-cache bash grep sed coreutils

# Копируем entrypoint скрипт
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Создаем директорию для ключей
RUN mkdir -p /openbao/keys && chmod 755 /openbao/keys

# Создаем директорию для логов
RUN mkdir -p /openbao/logs && chmod 755 /openbao/logs

# Используем наш entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
