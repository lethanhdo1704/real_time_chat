// frontend/src/services/api.js
import axios from "axios";

// Base URL from environment variable with fallback
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Base Axios instance for all API requests
 * Automatically handles:
 * - JWT token injection
 * - 401 token expiration
 * - Response/Error normalization
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("❌ [API] Request error:", error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          console.error("❌ [API] 401 Unauthorized");
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          
          // Soft redirect với delay để tránh race condition
          if (
            window.location.pathname !== "/login" &&
            !window.location.pathname.startsWith("/register") &&
            !window.location.pathname.startsWith("/forgot")
          ) {
            setTimeout(() => {
              const stillNoToken = !localStorage.getItem("token") && !sessionStorage.getItem("token");
              if (stillNoToken) {
                console.log("🚪 [API] Redirecting to /login");
                window.location.href = "/login";
              }
            }, 100);
          }
          break;

        case 403:
          console.error("❌ [API] 403 Forbidden");
          break;

        case 404:
          console.error("❌ [API] 404 Not found");
          break;

        case 429:
          console.error("❌ [API] 429 Rate limited");
          break;

        case 500:
          console.error("❌ [API] 500 Server error");
          break;

        default:
          console.error(`❌ [API] Error ${status}:`, data?.error || data?.message || error.message);
      }

      // ✅ GIỮ NGUYÊN error object của axios để useLogin có thể access err.response.data.error
      return Promise.reject(error);
    }

    if (error.request) {
      console.error("❌ [API] Network error");
      // ✅ Tạo error object giống cấu trúc axios
      const networkError = new Error("Network error. Please check your connection.");
      networkError.request = error.request;
      return Promise.reject(networkError);
    }

    console.error("❌ [API] Request setup error:", error.message);
    return Promise.reject(error);
  }
);

export default api;