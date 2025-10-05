import { create } from "zustand";
import { syncManager, SyncState } from "../../services/syncManager";
import { openBaoService } from "../../services/openBaoService";

/**
 * Store для управления синхронизацией с OpenBao
 */
interface SyncStore {
  // Состояние синхронизации
  syncState: SyncState;
  
  // OpenBao токен информация
  openBaoToken: string | null;
  tokenExpiry: number | null;
  isTokenValid: boolean;
  
  // Действия
  updateSyncState: (state: SyncState) => void;
  updateTokenInfo: () => void;
  startSync: (masterPassword: string) => Promise<void>;
  forceSync: (masterPassword: string) => Promise<void>;
  startPeriodicSync: (masterPassword: string) => void;
  stopPeriodicSync: () => void;
  checkConnection: () => Promise<boolean>;
}

const useSyncStore = create<SyncStore>((set, get) => {
  // Подписываемся на изменения состояния синхронизации
  syncManager.subscribe((syncState) => {
    set({ syncState });
  });

  return {
    // Начальное состояние
    syncState: syncManager.getState(),
    openBaoToken: null,
    tokenExpiry: null,
    isTokenValid: false,

    /**
     * Обновить состояние синхронизации
     */
    updateSyncState: (syncState: SyncState) => {
      set({ syncState });
    },

    /**
     * Обновить информацию о токене
     */
    updateTokenInfo: () => {
      const token = openBaoService.getCurrentToken();
      const expiry = openBaoService.getTokenExpiry();
      const isValid = openBaoService.isTokenValid();

      set({
        openBaoToken: token,
        tokenExpiry: expiry,
        isTokenValid: isValid,
      });
    },

    /**
     * Запустить автоматическую синхронизацию
     */
    startSync: async (masterPassword: string) => {
      try {
        await syncManager.autoSync(masterPassword);
        get().updateTokenInfo();
      } catch (error) {
        console.error("Ошибка синхронизации:", error);
        throw error;
      }
    },

    /**
     * Принудительная синхронизация
     */
    forceSync: async (masterPassword: string) => {
      try {
        await syncManager.forceSync(masterPassword);
        get().updateTokenInfo();
      } catch (error) {
        console.error("Ошибка принудительной синхронизации:", error);
        throw error;
      }
    },

    /**
     * Запустить периодическую синхронизацию
     */
    startPeriodicSync: (masterPassword: string) => {
      syncManager.startPeriodicSync(masterPassword);
    },

    /**
     * Остановить периодическую синхронизацию
     */
    stopPeriodicSync: () => {
      syncManager.stopPeriodicSync();
    },

    /**
     * Проверить соединение с OpenBao
     */
    checkConnection: async () => {
      const isOnline = await syncManager.checkConnection();
      get().updateTokenInfo();
      return isOnline;
    },
  };
});

export default useSyncStore;
