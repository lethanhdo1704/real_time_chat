import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    host: true,          // ⭐ cho phép truy cập bằng IP LAN
    port: 5173,
    strictPort: true,

    // nếu có backend API thì dùng proxy (khuyến nghị)
    proxy: {
      "/api": {
        target: "http://localhost:5000", // backend của bạn
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
