import { create } from "zustand";
import { ApplicationsHistory } from "./types";

const useApplicationsHistory = create<ApplicationsHistory>()((set, get) => ({
  applicationsHistory: [],

  setApplicationsHistory: (
    applicationsHistory: ApplicationsHistory["applicationsHistory"],
  ) => {
    set({ ...get(), applicationsHistory });
  },

  status: "update",
  setStatus: (status: "update" | "pass") => {
    set({ ...get(), status });
  },
}));

export default useApplicationsHistory;
