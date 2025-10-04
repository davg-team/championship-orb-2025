import { create } from "zustand";
import type { ThemeStore } from "./types";

const useThemeStore = create<ThemeStore>()((set, get) => ({
  theme: (localStorage.getItem("theme") as ThemeStore["theme"]) || "light",
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    set({ theme });
  },
  toggleTheme: () => {
    const newValue = get().theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", newValue);
    set(() => ({ theme: newValue }));
  },
}));

export default useThemeStore;
