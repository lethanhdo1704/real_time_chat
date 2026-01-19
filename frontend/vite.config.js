import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    plugins: [react()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },

    // ======================
    // DEV SERVER
    // ======================
    server: {
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
    },

    // ======================
    // PRODUCTION BUILD
    // ======================
    build: {
      minify: "terser", // 🔥 BẮT BUỘC
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: true,
        },
      },
    },
  };
});
