import { create } from "zustand";
import type { ModalStore } from "../../types";

const useApplicationModal = create<ModalStore>()((set, get) => ({
  isOpen: false,
  toggle: () => {
    set({ isOpen: !get().isOpen });
  },
}));

export default useApplicationModal;
