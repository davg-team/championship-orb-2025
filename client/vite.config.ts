import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react()],

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  // Настройки для работы с Node.js модулями в Tauri
  define: {
    global: "globalThis",
    // Polyfills для Node.js модулей
    "process.env": {},
    "process.platform": '"browser"',
  },

  resolve: {
    alias: {
      app: "/src/app/",
      features: "/src/features/",
      pages: "/src/pages/",
      shared: "/src/shared/",
      widgets: "/src/widgets/",
      entities: "entities",
      "~@diplodoc": "/node_modules/@diplodoc/",
    },
  },

  // Оптимизация зависимостей для предотвращения проблем с Node.js модулями
  // optimizeDeps: {
  //   exclude: ["@diplodoc/transform"],
  // },

  build: {
    // Увеличиваем лимит chunk size для больших зависимостей
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: (id) => {
        // Externalize Node.js built-ins для предотвращения ошибок
        return id.startsWith("node:") || ["path", "url", "source-map-js", "process"].includes(id);
      },
    },
  },
}));
