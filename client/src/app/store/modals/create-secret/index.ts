import { create } from "zustand";
import { ModalStore } from "../types";

interface CreateSecretModalStore extends ModalStore {
  initialName: string;
  setInitialName: (name: string) => void;
}

const useCreateSecretModalStore = create<CreateSecretModalStore>()((set, get) => ({
  isOpen: false,
  initialName: "",
  toggleIsOpen: () => {
    set({ isOpen: !get().isOpen });
  },
  setIsOpen: (isOpen: boolean) => {
    set({ ...get(), isOpen });
  },
  setInitialName: (name: string) => {
    set({ ...get(), initialName: name });
  },
}));

export default useCreateSecretModalStore;
