import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  listSecrets,
  listItems,
  saveSecret,
  getSecret as getTauriSecret,
  updateSecret,
  deleteSecret as deleteTauriSecret,
  encryptItem,
  decryptItem,
  deleteItem,
} from "shared/tauri/vault";
import { Secret, SecretListItem, LegacySecret } from "shared/types/secret";
import { isLegacySecret, migrateLegacySecret } from "shared/utils/secretUtils";

/**
 * Глобальный store для секретов
 */
interface SecretsStore {
  secrets: SecretListItem[];
  loading: boolean;
  error: string | null;

  // Actions
  loadSecrets: () => Promise<void>;
  addSecretNew: (secret: Secret, masterPassword: string) => Promise<void>;
  getSecretById: (id: string, masterPassword: string) => Promise<Secret | null>;
  updateSecretById: (secret: Secret, masterPassword: string) => Promise<void>;
  deleteSecret: (id: string) => Promise<void>;
  refreshSecrets: () => Promise<void>;

  // Legacy methods
  addSecret: (
    id: string,
    name: string,
    login: string,
    password: string,
    host: string,
    masterPassword: string,
  ) => Promise<void>;
  getSecret: (
    id: string,
    masterPassword: string,
  ) => Promise<LegacySecret | null>;
}

const useSecretsStore = create<SecretsStore>()(
  subscribeWithSelector((set, get) => ({
    secrets: [],
    loading: false,
    error: null,

    /**
     * Загрузка списка секретов
     */
    loadSecrets: async () => {
      set({ loading: true, error: null });
      try {
        // Пробуем загрузить из нового API
        try {
          const items = await listSecrets();
          console.log(`📋 Загружено ${items.length} секретов из локального хранилища`);
          set({ secrets: items });
        } catch (err) {
          // Fallback на старый API для миграции
          console.warn("Используется старый API, требуется миграция");
          const legacyItems = await listItems();
          console.log(`📋 Загружено ${legacyItems.length} секретов из старого API`);
          set({
            secrets: legacyItems.map((item) => ({
              id: item.id,
              name: "Секрет базы данных", // Временное имя
              type: "database" as any,
              created_at: item.created_at,
            })),
          });
        }
      } catch (err) {
        console.error("Ошибка загрузки секретов:", err);
        set({ error: "Не удалось загрузить список секретов" });
      } finally {
        set({ loading: false });
      }
    },

    /**
     * Добавить новый секрет (новый формат)
     */
    addSecretNew: async (secret: Secret, masterPassword: string) => {
      set({ loading: true, error: null });
      try {
        await saveSecret(secret, masterPassword);
        await get().loadSecrets(); // Обновляем список
      } catch (err) {
        console.error("Ошибка добавления секрета:", err);
        set({ error: "Не удалось сохранить секрет" });
        throw err;
      } finally {
        set({ loading: false });
      }
    },

    /**
     * Получить секрет по ID
     */
    getSecretById: async (
      id: string,
      masterPassword: string,
    ): Promise<Secret | null> => {
      set({ error: null });
      try {
        // Пробуем новый API
        try {
          const secret = await getTauriSecret(id, masterPassword);
          // @ts-ignore
          return secret;
        } catch (err) {
          // Fallback на старый API и миграция
          console.warn("Используется старый API для получения секрета");
          const legacySecret = await decryptItem(id, masterPassword);
          if (isLegacySecret(legacySecret)) {
            return migrateLegacySecret(id, legacySecret);
          }
          throw new Error("Неизвестный формат секрета");
        }
      } catch (err) {
        console.error("Ошибка получения секрета:", err);
        set({ error: "Не удалось получить секрет" });
        return null;
      }
    },

    /**
     * Обновить секрет
     */
    updateSecretById: async (secret: Secret, masterPassword: string) => {
      set({ loading: true, error: null });
      try {
        await updateSecret(secret, masterPassword);
        await get().loadSecrets(); // Обновляем список
      } catch (err) {
        console.error("Ошибка обновления секрета:", err);
        set({ error: "Не удалось обновить секрет" });
        throw err;
      } finally {
        set({ loading: false });
      }
    },

    /**
     * Удалить секрет
     */
    deleteSecret: async (id: string) => {
      set({ loading: true, error: null });
      try {
        // Пробуем новый API
        try {
          await deleteTauriSecret(id);
        } catch (err) {
          // Fallback на старый API
          await deleteItem(id);
        }
        await get().loadSecrets(); // Обновляем список
      } catch (err) {
        console.error("Ошибка удаления секрета:", err);
        set({ error: "Не удалось удалить секрет" });
        throw err;
      } finally {
        set({ loading: false });
      }
    },

    /**
     * Обновить список секретов
     */
    refreshSecrets: async () => {
      console.log("🔄 Обновление списка секретов...");
      await get().loadSecrets();
      console.log("✅ Список секретов обновлён");
    },

    // ============================================
    // Старые методы для обратной совместимости
    // ============================================

    /**
     * @deprecated Используйте addSecretNew с новой структурой Secret
     */
    addSecret: async (
      id: string,
      name: string,
      login: string,
      password: string,
      host: string,
      masterPassword: string,
    ) => {
      set({ loading: true, error: null });
      try {
        await encryptItem(id, name, login, password, host, masterPassword);
        await get().loadSecrets(); // Обновляем список
      } catch (err) {
        console.error("Ошибка добавления секрета:", err);
        set({ error: "Не удалось сохранить секрет" });
        throw err;
      } finally {
        set({ loading: false });
      }
    },

    /**
     * @deprecated Используйте getSecretById
     */
    getSecret: async (
      id: string,
      masterPassword: string,
    ): Promise<LegacySecret | null> => {
      set({ error: null });
      try {
        const secret = await decryptItem(id, masterPassword);
        return secret as LegacySecret;
      } catch (err) {
        console.error("Ошибка получения секрета:", err);
        set({ error: "Не удалось получить секрет" });
        return null;
      }
    },
  })),
);

// Автоматическая загрузка секретов при инициализации
useSecretsStore.getState().loadSecrets();

export default useSecretsStore;

