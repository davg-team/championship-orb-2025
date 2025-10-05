import { create } from "zustand";
import type { ModalStore } from "../../types";

const useAgreeModal = create<ModalStore>()((set, get) => ({
  isOpen: false,
  toggle: () => {
    set({ isOpen: !get().isOpen });
  },
  setData: (data: any) => {
    set({ ...get(), data });
  },
  data: {},
}));

export default useAgreeModal;
