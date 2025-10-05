import { create } from "zustand";
import { ModalStore } from "../types";
import { SecretType } from "shared/types/secret";

interface RequestAccessModalStore extends ModalStore {
  initialSecretName: string;
  initialSecretType: SecretType | null;
  setInitialSecretName: (name: string) => void;
  setInitialSecretType: (type: SecretType | null) => void;
  setInitialData: (name: string, type: SecretType | null) => void;
  resetInitialData: () => void;
}

const useRequestAccessModal = create<RequestAccessModalStore>()((set, get) => {
  return {
    isOpen: false,
    initialSecretName: "",
    initialSecretType: null,
    toggleIsOpen: () => {
      set({ isOpen: !get().isOpen });
    },
    setIsOpen: (isOpen: boolean) => {
      set({ isOpen });
    },
    setInitialSecretName: (name: string) => {
      set({ initialSecretName: name });
    },
    setInitialSecretType: (type: SecretType | null) => {
      set({ initialSecretType: type });
    },
    setInitialData: (name: string, type: SecretType | null) => {
      set({ initialSecretName: name, initialSecretType: type });
    },
    resetInitialData: () => {
      set({ initialSecretName: "", initialSecretType: null });
    },
  };
});

export default useRequestAccessModal;
