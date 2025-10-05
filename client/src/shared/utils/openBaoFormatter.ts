import { Secret, OpenBaoSecret } from "shared/types/secret";

/**
 * Конвертировать наш секрет в формат OpenBao KV v2
 */
export function toOpenBaoFormat(secret: Secret): OpenBaoSecret {
  return {
    data: secret.data,
    metadata: {
      created_time: secret.metadata.created_at,
      version: 1,
      destroyed: false,
      custom_metadata: {
        secret_type: secret.type,
        secret_name: secret.name,
        ...(secret.metadata.tags && {
          tags: secret.metadata.tags.join(","),
        }),
        ...(secret.metadata.description && {
          description: secret.metadata.description,
        }),
        ...(secret.metadata.resource_name && {
          resource_name: secret.metadata.resource_name,
        }),
        ...(secret.metadata.expires_at && {
          expires_at: secret.metadata.expires_at,
        }),
      },
    },
  };
}

/**
 * Конвертировать секрет из формата OpenBao в наш формат
 */
export function fromOpenBaoFormat(
  id: string,
  openBaoSecret: OpenBaoSecret,
): Secret {
  const customMetadata = openBaoSecret.metadata?.custom_metadata || {};

  return {
    id,
    name: customMetadata.secret_name || "Unnamed Secret",
    type: (customMetadata.secret_type as any) || "generic",
    data: openBaoSecret.data,
    metadata: {
      created_at:
        openBaoSecret.metadata?.created_time || new Date().toISOString(),
      tags: customMetadata.tags
        ? customMetadata.tags.split(",").filter(Boolean)
        : undefined,
      description: customMetadata.description,
      resource_name: customMetadata.resource_name,
      expires_at: customMetadata.expires_at,
    },
    createdAt: "",
  };
}

/**
 * Подготовить данные для записи в OpenBao
 * OpenBao KV v2 API требует данные в формате: { data: {...}, options: {...} }
 */
export function prepareOpenBaoWritePayload(secret: Secret): {
  data: Record<string, string>;
  options?: {
    cas?: number;
  };
} {
  return {
    data: secret.data,
    options: {},
  };
}

/**
 * Валидация ответа от OpenBao
 */
export function validateOpenBaoResponse(response: any): {
  valid: boolean;
  error?: string;
} {
  if (!response) {
    return { valid: false, error: "Пустой ответ от сервера" };
  }

  if (response.errors && Array.isArray(response.errors)) {
    return {
      valid: false,
      error: response.errors.join(", "),
    };
  }

  if (!response.data) {
    return { valid: false, error: "Отсутствуют данные в ответе" };
  }

  return { valid: true };
}

/**
 * Получить путь секрета в OpenBao
 * Формат: secret/data/{path}
 */
export function getOpenBaoSecretPath(
  secretName: string,
  mountPath: string = "secret",
): string {
  // Очищаем имя от недопустимых символов
  const cleanName = secretName.replace(/[^a-zA-Z0-9-_]/g, "_").toLowerCase();
  return `${mountPath}/data/${cleanName}`;
}

/**
 * Получить путь метаданных секрета в OpenBao
 * Формат: secret/metadata/{path}
 */
export function getOpenBaoMetadataPath(
  secretName: string,
  mountPath: string = "secret",
): string {
  const cleanName = secretName.replace(/[^a-zA-Z0-9-_]/g, "_").toLowerCase();
  return `${mountPath}/metadata/${cleanName}`;
}

/**
 * Парсинг ошибок OpenBao API
 */
export function parseOpenBaoError(error: any): string {
  if (typeof error === "string") {
    return error;
  }

  if (error?.response?.data?.errors) {
    return error.response.data.errors.join(", ");
  }

  if (error?.message) {
    return error.message;
  }

  return "Неизвестная ошибка при работе с OpenBao";
}

/**
 * Проверить совместимость секрета с OpenBao
 */
export function isOpenBaoCompatible(secret: Secret): {
  compatible: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Проверка имени
  if (!/^[a-zA-Z0-9-_]+$/.test(secret.name)) {
    issues.push(
      "Имя содержит недопустимые символы (допускаются только буквы, цифры, дефис и подчёркивание)",
    );
  }

  // Проверка размера данных
  const dataSize = JSON.stringify(secret.data).length;
  if (dataSize > 1024 * 1024) {
    // 1MB лимит
    issues.push("Размер данных превышает 1MB");
  }

  // Проверка полей данных
  for (const [key, value] of Object.entries(secret.data)) {
    if (typeof value !== "string") {
      issues.push(`Поле "${key}" должно быть строкой`);
    }
  }

  return {
    compatible: issues.length === 0,
    issues,
  };
}
