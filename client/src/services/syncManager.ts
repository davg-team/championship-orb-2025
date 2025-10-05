import { openBaoService, OpenBaoSecret } from "./openBaoService";
import { Secret } from "shared/types/secret";
import { saveSecret, listSecrets } from "shared/tauri/vault";

export type SyncStatus = "idle" | "syncing" | "success" | "error";
export type SyncMode = "online" | "offline";

export interface SyncState {
  status: SyncStatus;
  mode: SyncMode;
  lastSyncTime: number | null;
  error: string | null;
  progress: {
    current: number;
    total: number;
  };
}

/**
 * Менеджер синхронизации локальных секретов с OpenBao
 */
class SyncManager {
  private syncInterval: number | null = null;
  private syncState: SyncState = {
    status: "idle",
    mode: "offline",
    lastSyncTime: null,
    error: null,
    progress: {
      current: 0,
      total: 0,
    },
  };
  private listeners: Array<(state: SyncState) => void> = [];

  // Константы
  private readonly SYNC_INTERVAL = 10 * 60 * 1000; // 10 минут
  private readonly LAST_SYNC_KEY = "last_sync_time";

  constructor() {
    // Загружаем время последней синхронизации
    const lastSync = localStorage.getItem(this.LAST_SYNC_KEY);
    if (lastSync) {
      this.syncState.lastSyncTime = parseInt(lastSync, 10);
    }
  }

  /**
   * Подписаться на изменения состояния синхронизации
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener);
    // Сразу вызываем listener с текущим состоянием
    listener(this.syncState);

    // Возвращаем функцию отписки
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Обновить состояние синхронизации
   */
  private updateState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    this.listeners.forEach((listener) => listener(this.syncState));
  }

  /**
   * Получить текущее состояние
   */
  getState(): SyncState {
    return this.syncState;
  }

  /**
   * Конвертировать OpenBao секрет в локальный формат
   */
  private convertOpenBaoToLocal(obSecret: OpenBaoSecret): Secret {
    return {
      id: obSecret.id,
      name: obSecret.name,
      type: obSecret.secret_type as any,
      data: obSecret.data,
      createdAt: obSecret.metadata?.created_time || new Date().toISOString(),
      metadata: {
        created_at: obSecret.metadata?.created_time || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_local: false, // Секрет из OpenBao
        sync_status: "synced",
      },
    };
  }

  /**
   * Проверить доступность OpenBao
   */
  async checkConnection(): Promise<boolean> {
    try {
      console.log("🔍 Проверяем соединение с OpenBao...");
      
      const isHealthy = await openBaoService.healthCheck();
      console.log(`🏥 OpenBao health check: ${isHealthy ? "✅ OK" : "❌ FAIL"}`);
      
      // Проверяем только здоровье сервера, токен может быть получен позже
      const isOnline = isHealthy;
      this.updateState({ mode: isOnline ? "online" : "offline" });
      
      console.log(`🌐 Режим работы: ${isOnline ? "online" : "offline"}`);
      return isOnline;
    } catch (error) {
      console.error("❌ Ошибка проверки соединения с OpenBao:", error);
      this.updateState({ mode: "offline" });
      return false;
    }
  }

  /**
   * Полная синхронизация (первый вход)
   */
  async fullSync(masterPassword: string): Promise<void> {
    console.log("🔄 Начинаем полную синхронизацию...");

    this.updateState({
      status: "syncing",
      error: null,
      progress: { current: 0, total: 0 },
    });

    try {
      // Проверяем соединение
      const isOnline = await this.checkConnection();
      if (!isOnline) {
        throw new Error("OpenBao недоступен");
      }

      console.log("📥 Получаем секреты из OpenBao...");
      // Получаем все секреты из OpenBao
      const obSecrets = await openBaoService.getAllSecrets();
      
      console.log(`📋 Получено ${obSecrets.length} секретов из OpenBao`);
      this.updateState({
        progress: { current: 0, total: obSecrets.length },
      });

      // Сохраняем каждый секрет локально
      let syncedCount = 0;
      for (const obSecret of obSecrets) {
        try {
          const localSecret = this.convertOpenBaoToLocal(obSecret);
          await saveSecret(localSecret, masterPassword);
          syncedCount++;
          
          this.updateState({
            progress: { current: syncedCount, total: obSecrets.length },
          });
        } catch (error) {
          console.error(`⚠️ Ошибка сохранения секрета ${obSecret.id}:`, error);
          // Продолжаем с остальными
        }
      }

      // Обновляем время последней синхронизации
      const now = Date.now();
      localStorage.setItem(this.LAST_SYNC_KEY, now.toString());

      this.updateState({
        status: "success",
        lastSyncTime: now,
        progress: { current: syncedCount, total: obSecrets.length },
      });

      console.log(`✅ Полная синхронизация завершена: ${syncedCount}/${obSecrets.length} секретов`);
    } catch (error) {
      console.error("❌ Ошибка полной синхронизации:", error);
      this.updateState({
        status: "error",
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      });
      throw error;
    }
  }

  /**
   * Инкрементальная синхронизация
   */
  async incrementalSync(masterPassword: string): Promise<void> {
    console.log("🔄 Начинаем инкрементальную синхронизацию...");

    this.updateState({
      status: "syncing",
      error: null,
    });

    try {
      // Проверяем соединение
      const isOnline = await this.checkConnection();
      if (!isOnline) {
        throw new Error("OpenBao недоступен");
      }

      // Получаем локальные секреты
      const localSecrets = await listSecrets();
      const localSecretsMap = new Map(localSecrets.map((s) => [s.id, s]));

      // Получаем секреты из OpenBao
      const obSecrets = await openBaoService.getAllSecrets();

      let updatedCount = 0;
      let addedCount = 0;

      for (const obSecret of obSecrets) {
        const localSecret = localSecretsMap.get(obSecret.id);

        if (!localSecret) {
          // Новый секрет - добавляем
          const secret = this.convertOpenBaoToLocal(obSecret);
          await saveSecret(secret, masterPassword);
          addedCount++;
          console.log(`➕ Добавлен новый секрет: ${obSecret.name}`);
        } else {
          // Проверяем, нужно ли обновить
          const obTime = new Date(obSecret.metadata?.created_time || 0).getTime();
          const localTime = new Date(localSecret.created_at).getTime();

          if (obTime > localTime) {
            // Серверная версия новее - обновляем
            const secret = this.convertOpenBaoToLocal(obSecret);
            await saveSecret(secret, masterPassword);
            updatedCount++;
            console.log(`🔄 Обновлён секрет: ${obSecret.name}`);
          }
        }
      }

      // Обновляем время последней синхронизации
      const now = Date.now();
      localStorage.setItem(this.LAST_SYNC_KEY, now.toString());

      this.updateState({
        status: "success",
        lastSyncTime: now,
      });

      console.log(`✅ Инкрементальная синхронизация завершена: +${addedCount} новых, ~${updatedCount} обновлено`);
    } catch (error) {
      console.error("❌ Ошибка инкрементальной синхронизации:", error);
      this.updateState({
        status: "error",
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      });
      throw error;
    }
  }

  /**
   * Автоматическая синхронизация
   * Выбирает между полной и инкрементальной в зависимости от истории
   */
  async autoSync(masterPassword: string): Promise<void> {
    const isFirstSync = this.syncState.lastSyncTime === null;
    
    if (isFirstSync) {
      console.log("📥 Первая синхронизация - выполняем полную");
      await this.fullSync(masterPassword);
    } else {
      console.log("🔄 Выполняем инкрементальную синхронизацию");
      await this.incrementalSync(masterPassword);
    }
  }

  /**
   * Запустить периодическую синхронизацию
   */
  startPeriodicSync(masterPassword: string): void {
    // Останавливаем предыдущий интервал, если был
    this.stopPeriodicSync();

    console.log(`⏱️ Запущена периодическая синхронизация (каждые ${this.SYNC_INTERVAL / 60000} минут)`);

    this.syncInterval = window.setInterval(async () => {
      try {
        await this.incrementalSync(masterPassword);
      } catch (error) {
        console.error("❌ Ошибка периодической синхронизации:", error);
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Остановить периодическую синхронизацию
   */
  stopPeriodicSync(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("⏸️ Периодическая синхронизация остановлена");
    }
  }

  /**
   * Принудительная синхронизация (вызывается пользователем)
   */
  async forceSync(masterPassword: string): Promise<void> {
    console.log("🔄 Принудительная синхронизация...");
    await this.incrementalSync(masterPassword);
  }

  /**
   * Проверить, нужна ли синхронизация
   */
  needsSync(): boolean {
    if (this.syncState.lastSyncTime === null) {
      return true; // Ещё ни разу не синхронизировались
    }

    const timeSinceLastSync = Date.now() - this.syncState.lastSyncTime;
    return timeSinceLastSync > this.SYNC_INTERVAL;
  }

  /**
   * Получить время с последней синхронизации в удобном формате
   */
  getTimeSinceLastSync(): string | null {
    if (this.syncState.lastSyncTime === null) {
      return null;
    }

    const diff = Date.now() - this.syncState.lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "только что";
    if (minutes < 60) return `${minutes} мин. назад`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч. назад`;
    
    const days = Math.floor(hours / 24);
    return `${days} дн. назад`;
  }
}

// Экспортируем синглтон
export const syncManager = new SyncManager();
