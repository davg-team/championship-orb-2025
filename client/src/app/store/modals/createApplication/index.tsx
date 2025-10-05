import { create } from "zustand";
import { ModalStore } from "../types";

interface CreateApplicationModalStore extends ModalStore {}

const useCreateApplicationModal = create<CreateApplicationModalStore>()((set, get) => {
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

export default useCreateApplicationModal;
