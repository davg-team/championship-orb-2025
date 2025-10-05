import { create } from "zustand";

interface VaultSessionState {
  masterPassword: string | null;
  isUnlocked: boolean;
  setMasterPassword: (password: string) => void;
  clearSession: () => void;
}

/**
 * Глобальное состояние для текущей сессии хранилища
 * Хранит мастер-пароль в памяти для удобства работы
 */
const useVaultSession = create<VaultSessionState>((set) => ({
  masterPassword: null,
  isUnlocked: false,
  
  setMasterPassword: (password: string) =>
    set({ masterPassword: password, isUnlocked: true }),
  
  clearSession: () =>
    set({ masterPassword: null, isUnlocked: false }),
}));

export default useVaultSession;
