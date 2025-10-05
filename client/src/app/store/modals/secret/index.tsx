import { create } from "zustand";
import { ModalStore } from "../types";
import { Secret, SecretListItem } from "shared/types/secret";
import useRecentlyViewedStore from "../../recentlyViewed";
import { emit } from "@tauri-apps/api/event";

interface SecretModalStore extends ModalStore {
  secret: Secret | null;
  openModal: (secret: Secret) => void;
}

const useSecretModal = create<SecretModalStore>()((set, get) => {
  return {
    isOpen: false,
    secret: null,
    toggleIsOpen: () => {
      set({ isOpen: !get().isOpen });
    },
    setIsOpen: (isOpen: boolean) => {
      set({ isOpen });
      if (!isOpen) {
        set({ secret: null });
      }
    },
    openModal: async (secret: Secret) => {
      set({ secret, isOpen: true });

      // Добавляем в недавно просмотренные
      const listItem: SecretListItem = {
        id: secret.id,
        name: secret.name,
        type: secret.type,
        created_at: secret.createdAt,
        tags: secret.metadata?.tags,
        resource_name: secret.metadata?.resource_name,
      };
      useRecentlyViewedStore.getState().addRecentlyViewed(listItem);

      // Отправляем событие для обновления меню трея
      try {
        await emit("update-tray-menu");
      } catch (error) {
        console.error("Ошибка обновления меню трея:", error);
      }
    },
  };
});

export default useSecretModal;
