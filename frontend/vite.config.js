import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,

    // ✅ HTTPS cho FE (WebRTC cần)
    https: {
      key: fs.readFileSync("./cert/192.168.110.228-key.pem"),
      cert: fs.readFileSync("./cert/192.168.110.228.pem"),
    },

    // ✅ Proxy backend (KHÔNG lộ http/ws ra browser)
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },

      "/socket.io": {
        target: "http://127.0.0.1:5000",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      // ✅ BẮT BUỘC – avatar images
      "/uploads": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
