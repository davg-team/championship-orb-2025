import { create } from "zustand";
import { ModalStore } from "../types";

const useRequestRulesModal = create<ModalStore>()((set, get) => {
  return {
    isOpen: false,
    toggleIsOpen: () => {
      set({ isOpen: !get().isOpen });
    },
    setIsOpen: (isOpen: boolean) => {
      set({ isOpen });
    },
  };
});

export default useRequestRulesModal;
