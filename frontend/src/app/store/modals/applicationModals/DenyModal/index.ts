import { create } from "zustand";
import type { ModalStore } from "../../types";

const useDenyModal = create<ModalStore>()((set, get) => ({
  isOpen: false,
  toggle: () => {
    set({ ...get(), isOpen: !get().isOpen });
  },
  setData: (data: any) => {
    set({ ...get(), data });
  },
  data: {},
}));

export default useDenyModal;
