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
    // ✅ BẮT BUỘC để Forward Port hoạt động
    host: true,

    // ✅ Port bạn forward trong VS Code
    port: 5173,

    // ✅ Nếu port bị chiếm → fail luôn (đúng cho debug)
    strictPort: true,

    // ❌ KHÔNG DÙNG HTTPS (Forward Port rất kỵ)
    https: false,

    // ✅ Proxy backend (API + Socket.IO)
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
  },
});
