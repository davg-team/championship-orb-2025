# Базовый образ для Node.js
FROM node:20 AS builder

# Устанавливаем рабочую директорию
WORKDIR /

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем исходный код
COPY . .

# Сборка приложения
RUN npm run build --prod

# Стейдж для копирования результатов сборки
FROM debian:12-slim

# Создаем директорию для передачи сборки
WORKDIR /

# Копируем собранные файлы из стейджа builder (содержимое папки dist) в папку /dist
COPY --from=builder /dist /dist

# копируем содержимое папки dist в папку frontend/build
CMD ["cp", "-r", "/dist", "/frontend/build"]