import { SecretType, SecretFieldTemplate } from "shared/types/secret";
import { Database, Key, FileText, Terminal, Wrench } from "@gravity-ui/icons";

/**
 * Метаинформация о типе секрета
 */
export interface SecretTypeInfo {
  type: SecretType;
  label: string;
  description: string;
  icon: any; // Gravity UI icon
  fields: SecretFieldTemplate[];
}

/**
 * Шаблон для секретов баз данных
 */
const DATABASE_TEMPLATE: SecretTypeInfo = {
  type: SecretType.DATABASE,
  label: "База данных",
  description: "Данные для подключения к базе данных (PostgreSQL, MySQL, MongoDB и др.)",
  icon: Database,
  fields: [
    {
      key: "host",
      label: "Хост",
      type: "text",
      required: true,
      placeholder: "localhost или db.example.com",
      helpText: "IP адрес или доменное имя сервера БД",
    },
    {
      key: "port",
      label: "Порт",
      type: "number",
      required: false,
      placeholder: "5432",
      helpText: "Порт подключения (по умолчанию для PostgreSQL: 5432, MySQL: 3306)",
    },
    {
      key: "database",
      label: "База данных",
      type: "text",
      required: true,
      placeholder: "my_database",
      helpText: "Название базы данных",
    },
    {
      key: "username",
      label: "Пользователь",
      type: "text",
      required: true,
      placeholder: "postgres",
      helpText: "Имя пользователя для подключения",
    },
    {
      key: "password",
      label: "Пароль",
      type: "password",
      required: true,
      placeholder: "••••••••",
      helpText: "Пароль пользователя",
    },
    {
      key: "connection_string",
      label: "Строка подключения",
      type: "textarea",
      required: false,
      placeholder: "postgresql://user:password@host:5432/database",
      helpText: "Полная строка подключения (опционально)",
    },
    {
      key: "ssl",
      label: "SSL режим",
      type: "text",
      required: false,
      placeholder: "require",
      helpText: "Режим SSL: disable, require, verify-ca, verify-full",
    },
  ],
};

/**
 * Шаблон для API ключей
 */
const API_KEY_TEMPLATE: SecretTypeInfo = {
  type: SecretType.API_KEY,
  label: "API ключ",
  description: "API ключи, токены и секреты для внешних сервисов",
  icon: Key,
  fields: [
    {
      key: "key",
      label: "API ключ",
      type: "password",
      required: true,
      placeholder: "sk_live_...",
      helpText: "Публичный или основной API ключ",
    },
    {
      key: "secret",
      label: "API секрет",
      type: "password",
      required: false,
      placeholder: "secret_...",
      helpText: "Приватный секрет (если требуется)",
    },
    {
      key: "token",
      label: "Токен",
      type: "password",
      required: false,
      placeholder: "Bearer token...",
      helpText: "Bearer токен или access token",
    },
    {
      key: "endpoint",
      label: "API Endpoint",
      type: "url",
      required: false,
      placeholder: "https://api.example.com",
      helpText: "Базовый URL API сервиса",
    },
  ],
};

/**
 * Шаблон для сертификатов
 */
const CERTIFICATE_TEMPLATE: SecretTypeInfo = {
  type: SecretType.CERTIFICATE,
  label: "Сертификат",
  description: "SSL/TLS сертификаты и приватные ключи",
  icon: FileText,
  fields: [
    {
      key: "certificate",
      label: "Сертификат",
      type: "textarea",
      required: true,
      placeholder: "-----BEGIN CERTIFICATE-----\n...",
      helpText: "Публичный сертификат в формате PEM",
    },
    {
      key: "private_key",
      label: "Приватный ключ",
      type: "textarea",
      required: true,
      placeholder: "-----BEGIN PRIVATE KEY-----\n...",
      helpText: "Приватный ключ в формате PEM",
    },
    {
      key: "ca_certificate",
      label: "CA сертификат",
      type: "textarea",
      required: false,
      placeholder: "-----BEGIN CERTIFICATE-----\n...",
      helpText: "Сертификат центра сертификации (опционально)",
    },
    {
      key: "passphrase",
      label: "Парольная фраза",
      type: "password",
      required: false,
      placeholder: "••••••••",
      helpText: "Парольная фраза для расшифровки ключа (если установлена)",
    },
  ],
};

/**
 * Шаблон для SSH ключей
 */
const SSH_KEY_TEMPLATE: SecretTypeInfo = {
  type: SecretType.SSH_KEY,
  label: "SSH ключ",
  description: "SSH ключи для удалённого доступа к серверам",
  icon: Terminal,
  fields: [
    {
      key: "private_key",
      label: "Приватный ключ",
      type: "textarea",
      required: true,
      placeholder: "-----BEGIN OPENSSH PRIVATE KEY-----\n...",
      helpText: "Приватный SSH ключ",
    },
    {
      key: "public_key",
      label: "Публичный ключ",
      type: "textarea",
      required: false,
      placeholder: "ssh-rsa AAAAB3...",
      helpText: "Публичный SSH ключ (опционально)",
    },
    {
      key: "username",
      label: "Пользователь",
      type: "text",
      required: false,
      placeholder: "root",
      helpText: "Имя пользователя для SSH подключения",
    },
    {
      key: "host",
      label: "Хост",
      type: "text",
      required: false,
      placeholder: "server.example.com",
      helpText: "Адрес сервера",
    },
    {
      key: "port",
      label: "Порт",
      type: "number",
      required: false,
      placeholder: "22",
      helpText: "Порт SSH (по умолчанию 22)",
    },
    {
      key: "passphrase",
      label: "Парольная фраза",
      type: "password",
      required: false,
      placeholder: "••••••••",
      helpText: "Парольная фраза для расшифровки ключа (если установлена)",
    },
  ],
};

/**
 * Шаблон для произвольных секретов
 */
const GENERIC_TEMPLATE: SecretTypeInfo = {
  type: SecretType.GENERIC,
  label: "Произвольный",
  description: "Произвольные секреты с пользовательскими полями",
  icon: Wrench,
  fields: [], // Поля добавляются динамически пользователем
};

/**
 * Коллекция всех шаблонов секретов
 */
export const SECRET_TEMPLATES: Record<SecretType, SecretTypeInfo> = {
  [SecretType.DATABASE]: DATABASE_TEMPLATE,
  [SecretType.API_KEY]: API_KEY_TEMPLATE,
  [SecretType.CERTIFICATE]: CERTIFICATE_TEMPLATE,
  [SecretType.SSH_KEY]: SSH_KEY_TEMPLATE,
  [SecretType.GENERIC]: GENERIC_TEMPLATE,
};

/**
 * Получить шаблон по типу секрета
 */
export function getSecretTemplate(type: SecretType): SecretTypeInfo {
  return SECRET_TEMPLATES[type];
}

/**
 * Получить список всех доступных типов секретов
 */
export function getAvailableSecretTypes(): SecretTypeInfo[] {
  return Object.values(SECRET_TEMPLATES);
}

/**
 * Получить название типа секрета
 */
export function getSecretTypeLabel(type: SecretType): string {
  return SECRET_TEMPLATES[type]?.label || "Неизвестный тип";
}

/**
 * Получить иконку типа секрета
 */
export function getSecretTypeIcon(type: SecretType): any {
  return SECRET_TEMPLATES[type]?.icon || Wrench;
}
