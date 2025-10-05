import {
  Secret,
  SecretType,
  SecretMetadata,
  LegacySecret,
} from "shared/types/secret";

/**
 * Создать новый секрет с базовыми метаданными
 */
export function createSecret(
  id: string,
  name: string,
  type: SecretType,
  data: Record<string, string>,
  additionalMetadata?: Partial<SecretMetadata>,
): Secret {
  const now = new Date().toISOString();

  return {
    id,
    createdAt: now,
    name,
    type,
    data,
    metadata: {
      created_at: now,
      ...additionalMetadata,
    },
  };
}

/**
 * Валидация секрета
 */
export function validateSecret(secret: Secret): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!secret.id || secret.id.trim() === "") {
    errors.push("ID секрета не может быть пустым");
  }

  if (!secret.name || secret.name.trim() === "") {
    errors.push("Название секрета не может быть пустым");
  }

  if (!secret.type) {
    errors.push("Тип секрета должен быть указан");
  }

  if (!secret.data || Object.keys(secret.data).length === 0) {
    errors.push("Данные секрета не могут быть пустыми");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Конвертировать старый формат секрета в новый
 */
export function migrateLegacySecret(id: string, legacy: LegacySecret): Secret {
  return createSecret(
    id,
    legacy.name,
    SecretType.DATABASE,
    {
      host: legacy.host,
      username: legacy.login,
      password: legacy.password,
      database: legacy.name,
    },
    {
      description: "Мигрировано из старого формата",
    },
  );
}

/**
 * Проверить, является ли секрет старого формата
 */
export function isLegacySecret(data: any): data is LegacySecret {
  return (
    typeof data === "object" &&
    "name" in data &&
    "login" in data &&
    "password" in data &&
    "host" in data &&
    !("type" in data) &&
    !("metadata" in data)
  );
}

/**
 * Маскировать чувствительные данные для отображения
 */
export function maskSensitiveData(
  value: string,
  visibleChars: number = 4,
): string {
  if (!value || value.length <= visibleChars) {
    return "••••••••";
  }

  const visible = value.slice(-visibleChars);
  return `••••${visible}`;
}

/**
 * Получить описание секрета для отображения
 */
export function getSecretDisplayInfo(secret: Secret): {
  title: string;
  subtitle: string;
  details: string[];
} {
  const { name, type, data, metadata } = secret;

  let subtitle = "";
  const details: string[] = [];

  switch (type) {
    case SecretType.DATABASE:
      subtitle = data.host || "База данных";
      if (data.database) details.push(`БД: ${data.database}`);
      if (data.username) details.push(`Пользователь: ${data.username}`);
      break;

    case SecretType.API_KEY:
      subtitle = data.endpoint || "API сервис";
      if (data.key) details.push(`Ключ: ${maskSensitiveData(data.key)}`);
      break;

    case SecretType.CERTIFICATE:
      subtitle = "SSL/TLS сертификат";
      details.push("Сертификат и приватный ключ");
      break;

    case SecretType.SSH_KEY:
      subtitle = data.host ? `SSH: ${data.host}` : "SSH ключ";
      if (data.username) details.push(`Пользователь: ${data.username}`);
      break;

    case SecretType.GENERIC:
      subtitle = "Произвольный секрет";
      details.push(`Полей: ${Object.keys(data).length}`);
      break;
  }

  if (metadata.description) {
    details.push(metadata.description);
  }

  return {
    title: name,
    subtitle,
    details,
  };
}

/**
 * Фильтровать секреты по поисковому запросу
 */
export function filterSecrets(
  secrets: Secret[],
  searchQuery: string,
  filterType?: SecretType,
): Secret[] {
  let filtered = secrets;

  // Фильтр по типу
  if (filterType) {
    filtered = filtered.filter((s) => s.type === filterType);
  }

  // Поиск по имени, описанию, тегам
  if (searchQuery && searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((secret) => {
      const nameMatch = secret.name.toLowerCase().includes(query);
      const descMatch = secret.metadata.description
        ?.toLowerCase()
        .includes(query);
      const tagsMatch = secret.metadata.tags?.some((tag) =>
        tag.toLowerCase().includes(query),
      );
      const dataMatch = Object.values(secret.data).some((value) =>
        value.toLowerCase().includes(query),
      );

      return nameMatch || descMatch || tagsMatch || dataMatch;
    });
  }

  return filtered;
}

/**
 * Сортировать секреты
 */
export function sortSecrets(
  secrets: Secret[],
  sortBy: "name" | "type" | "created" | "updated" = "created",
  order: "asc" | "desc" = "desc",
): Secret[] {
  const sorted = [...secrets].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case "name":
        compareValue = a.name.localeCompare(b.name);
        break;
      case "type":
        compareValue = a.type.localeCompare(b.type);
        break;
      case "created":
        compareValue =
          new Date(a.metadata.created_at).getTime() -
          new Date(b.metadata.created_at).getTime();
        break;
      case "updated":
        const aTime = a.metadata.updated_at || a.metadata.created_at;
        const bTime = b.metadata.updated_at || b.metadata.created_at;
        compareValue = new Date(aTime).getTime() - new Date(bTime).getTime();
        break;
    }

    return order === "asc" ? compareValue : -compareValue;
  });

  return sorted;
}

/**
 * Проверить, истёк ли секрет
 */
export function isSecretExpired(secret: Secret): boolean {
  if (!secret.metadata || !secret.metadata.expires_at) {
    return false;
  }

  const expiryDate = new Date(secret.metadata.expires_at);
  return expiryDate.getTime() < Date.now();
}

/**
 * Проверить, истекает ли секрет скоро (в течение 7 дней)
 */
export function isSecretExpiringSoon(secret: Secret, daysThreshold: number = 7): boolean {
  if (!secret.metadata || !secret.metadata.expires_at) {
    return false;
  }

  const expiryDate = new Date(secret.metadata.expires_at);
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  const daysUntilExpiry = diff / (1000 * 60 * 60 * 24);

  return daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold;
}

/**
 * Получить оставшееся время до истечения секрета
 */
export function getTimeUntilExpiry(secret: Secret): string | null {
  if (!secret.metadata || !secret.metadata.expires_at) {
    return null;
  }

  const expiryDate = new Date(secret.metadata.expires_at);
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();

  if (diff < 0) {
    return "Истёк";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}д ${hours}ч`;
  } else if (hours > 0) {
    return `${hours}ч`;
  } else {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}м`;
  }
}
