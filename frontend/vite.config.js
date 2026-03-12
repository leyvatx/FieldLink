import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
      "@features": "/src/features",
      "@assets": "/src/assets",
      "@context": "/src/context",
      "@api": "/src/api",
      "@lib": "/src/lib",
      "@components": "/src/components",
      "@css": "/src/css",
      "@layouts": "/src/layouts",
      "@routes": "/src/routes",
      "@guards": "/src/guards",
      '@utils': "/src/utils",
      '@shared': "/src/../../shared",
      "@hooks": "/src/hooks",
    },
  },
  build: {
    modulePreload: false,
  },
});
