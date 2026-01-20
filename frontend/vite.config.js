import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  // ✅ DEV ONLY
  server: mode === "development"
    ? {
        host: true,
        port: 5173,
        strictPort: true,
        https: false,
        proxy: {
          "/api": {
            target: "http://127.0.0.1:5000",
            changeOrigin: true,
          },
          "/socket.io": {
            target: "http://127.0.0.1:5000",
            ws: true,
            changeOrigin: true,
          },
          "/uploads": {
            target: "http://127.0.0.1:5000",
            changeOrigin: true,
          },
        },
      }
    : undefined,

  // ✅ BUILD OUTPUT
  build: {
    outDir: "dist",
    sourcemap: false,
  },
}));
