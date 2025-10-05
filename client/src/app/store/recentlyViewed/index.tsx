import { create } from "zustand";
import { SecretListItem } from "shared/types/secret";

interface RecentlyViewedStore {
  recentlyViewed: SecretListItem[];
  addRecentlyViewed: (secret: SecretListItem) => void;
  clearRecentlyViewed: () => void;
}

const useRecentlyViewedStore = create<RecentlyViewedStore>()((set, get) => ({
  recentlyViewed: [],

  addRecentlyViewed: (secret: SecretListItem) => {
    const current = get().recentlyViewed;

    // Удаляем секрет, если он уже есть в списке
    const filtered = current.filter(s => s.id !== secret.id);

    // Добавляем в начало списка
    const updated = [secret, ...filtered];

    // Ограничиваем до 5 секретов
    const limited = updated.slice(0, 5);

    set({ recentlyViewed: limited });
  },

  clearRecentlyViewed: () => {
    set({ recentlyViewed: [] });
  },
}));

export default useRecentlyViewedStore;