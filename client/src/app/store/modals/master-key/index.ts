import { create } from "zustand";
import { ModalStore } from "../types";

const useMasterKeyModalStore = create<ModalStore>()((set, get) => ({
  isOpen: false,
  toggleIsOpen: () => {
    set({ isOpen: !get().isOpen });
  },
  setIsOpen: (isOpen: boolean) => {
    set({ ...get(), isOpen });
  },
}));

export default useMasterKeyModalStore;
