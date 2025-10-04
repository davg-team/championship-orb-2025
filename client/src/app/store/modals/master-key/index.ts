import { create } from "zustand";
import { ModalStore } from "../types";

const useMasterKeyModalStore = create<ModalStore>()((set, get) => ({
  isOpen: false,
  toggleIsOpen: () => {
    set({ isOpen: !(get() as ModalStore).isOpen });
  },
  setIsOpen: (isOpen: boolean) => {
    set({ isOpen });
  },
}));

export default useMasterKeyModalStore;
