import { create } from "zustand";
import type { Applications } from "./types";

const useApplications = create<Applications>()((set, get) => ({
  data: [],
  setData: (data: any) => {
    set({ ...get(), data });
  },
  status: "pass",
  setStatus: (status: any) => {
    set({ ...get(), status });
  },
}));

export default useApplications;
