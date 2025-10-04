# Базовый образ для Nginx
FROM nginx

# Создаем директорию для SSL сертификатов
RUN mkdir -p /etc/nginx/ssl

# Копируем конфиг для Nginx
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80
EXPOSE 443

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]
