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
    host: true,           // tương đương 0.0.0.0
    port: 5173,
    strictPort: true,

    // 👉 HTTPS cho WebRTC
    https: {
      key: fs.readFileSync("./cert/192.168.110.227-key.pem"),
      cert: fs.readFileSync("./cert/192.168.110.227.pem"),
    },

    // 👉 proxy backend HTTP
    proxy: {
      "/api": {
        target: "http://localhost:5000", // backend
        changeOrigin: true,
      },
      "/socket.io": {
        target: "ws://localhost:5000",
        ws: true,
      },
    },
  },
});
