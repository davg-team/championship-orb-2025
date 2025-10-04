import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
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
      url: "url",
    },
  },
});
