import { invoke } from "@tauri-apps/api/core";
import { Secret, SecretListItem } from "shared/types/secret";

// ============================================
// Команды инициализации хранилища
// ============================================

/**
 * Проверить, инициализировано ли хранилище
 */
export async function isVaultInitialized(): Promise<boolean> {
  return invoke("is_vault_initialized");
}

/**
 * Инициализировать хранилище с мастер-паролем
 */
export async function initializeVault(masterPassword: string): Promise<void> {
  return invoke("initialize_vault", {
    masterPassword,
  });
}

/**
 * Проверить мастер-пароль
 */
export async function verifyVaultPassword(masterPassword: string): Promise<boolean> {
  return invoke("verify_vault_password", {
    masterPassword,
  });
}

/**
 * Изменить мастер-пароль
 */
export async function changeMasterPassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  return invoke("change_master_password", {
    oldPassword,
    newPassword,
  });
}

// ============================================
// Команды для работы с секретами
// ============================================

/**
 * Сохранить секрет (новый универсальный формат)
 */
export async function saveSecret(
  secret: Secret,
  masterPassword: string
): Promise<void> {
  return invoke("save_secret", {
    secret: JSON.stringify(secret),
    masterPassword,
  });
}

/**
 * Получить секрет по ID
 */
export async function getSecret(
  id: string,
  masterPassword: string
): Promise<string> {
  const res = await invoke("get_secret", {
    id,
    masterPassword,
  });
  return res as string;
}

/**
 * Получить список всех секретов (краткая информация)
 */
export async function listSecrets(): Promise<SecretListItem[]> {
  const data = await invoke("list_secrets");
  return JSON.parse(data as string) as SecretListItem[];
}

/**
 * Удалить секрет
 */
export async function deleteSecret(id: string): Promise<void> {
  return invoke("delete_secret", { id });
}

/**
 * Обновить секрет
 */
export async function updateSecret(
  secret: Secret,
  masterPassword: string
): Promise<void> {
  return invoke("update_secret", {
    secret: JSON.stringify(secret),
    masterPassword,
  });
}

// ============================================
// Устаревшие функции для обратной совместимости
// ============================================

/**
 * @deprecated Используйте saveSecret с новой структурой
 */
export async function encryptItem(
  id: string,
  name: string,
  login: string,
  passwordField: string,
  host: string,
  masterPassword: string,
) {
  return invoke("encrypt_item", {
    id,
    name,
    login,
    passwordField,
    host,
    masterPassword,
  });
}

/**
 * @deprecated Используйте getSecret
 */
export async function decryptItem(
  id: string,
  masterPassword: string,
): Promise<{ name: string; login: string; password: string; host: string }> {
  const res = await invoke("get_secret", {
    id,
    masterPassword,
  });

  // Парсим новый формат секрета
  const secret: Secret = JSON.parse(res as string);

  // Преобразуем в старый формат для обратной совместимости
  if (secret.type === 'database') {
    const data = secret.data as any;
    return {
      name: secret.name,
      login: data.login || '',
      password: data.password || '',
      host: data.host || '',
    };
  }

  // Для других типов возвращаем базовую структуру
  return {
    name: secret.name,
    login: '',
    password: '',
    host: '',
  };
}

/**
 * @deprecated Используйте listSecrets
 */
export async function listItems() {
  const data = await invoke("list_items");
  return data as Array<{ id: string; created_at: string }>;
}

/**
 * @deprecated Используйте deleteSecret
 */
export async function deleteItem(id: string) {
  return invoke("delete_item", { id });
}
