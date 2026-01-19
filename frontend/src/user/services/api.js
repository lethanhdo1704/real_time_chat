// frontend/src/services/api.js
import axios from "axios";

/**
 * ⚠️ QUAN TRỌNG
 * - KHÔNG dùng IP backend
 * - KHÔNG dùng http://localhost:5000
 * - CHỈ dùng relative path để Vite proxy xử lý
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 10000,
});


// ============================================
// REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

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
  (response) => response,
  (error) => {
    // ======================
    // SERVER RESPONSE ERROR
    // ======================
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          console.error("❌ [API] 401 Unauthorized");

          localStorage.removeItem("token");
          sessionStorage.removeItem("token");

          if (
            window.location.pathname !== "/login" &&
            !window.location.pathname.startsWith("/register") &&
            !window.location.pathname.startsWith("/forgot")
          ) {
            setTimeout(() => {
              const stillNoToken =
                !localStorage.getItem("token") &&
                !sessionStorage.getItem("token");

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
          console.error("❌ [API] 404 Not Found");
          break;

        case 429:
          console.error("❌ [API] 429 Rate Limited");
          break;

        case 500:
          console.error("❌ [API] 500 Server Error");
          break;

        default:
          console.error(
            `❌ [API] Error ${status}:`,
            data?.error || data?.message || error.message
          );
      }

      return Promise.reject(error);
    }

    // ======================
    // NETWORK ERROR
    // ======================
    if (error.request) {
      console.error("❌ [API] Network error");

      const networkError = new Error(
        "Network error. Please check your connection."
      );
      networkError.request = error.request;

      return Promise.reject(networkError);
    }

    // ======================
    // UNKNOWN ERROR
    // ======================
    console.error("❌ [API] Request setup error:", error.message);
    return Promise.reject(error);
  }
);

export default api;
