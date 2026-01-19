import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? import.meta.env.VITE_API_URL   // 👈 Render backend
    : "/api",                        // 👈 Vite proxy local
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default api;
