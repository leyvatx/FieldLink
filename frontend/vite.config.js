import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: [
      { find: "@features", replacement: "/src/features" },
      { find: "@assets", replacement: "/src/assets" },
      { find: "@context", replacement: "/src/context" },
      { find: "@api", replacement: "/src/api" },
      { find: "@lib", replacement: "/src/lib" },
      { find: "@components", replacement: "/src/components" },
      { find: "@css", replacement: "/src/css" },
      { find: "@layouts", replacement: "/src/layouts" },
      { find: "@routes", replacement: "/src/routes" },
      { find: "@guards", replacement: "/src/guards" },
      { find: "@utils", replacement: "/src/utils" },
      { find: "@shared", replacement: "/src/../../shared" },
      { find: "@hooks", replacement: "/src/hooks" },
      { find: "@", replacement: "/src" },
    ],
  },
  build: {
    modulePreload: false,
  },
});
