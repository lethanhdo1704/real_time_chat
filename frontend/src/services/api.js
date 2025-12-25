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
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
  (config) => {
    // Get token from storage (prioritize localStorage)
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
api.interceptors.response.use(
  (response) => {
    // Return data directly for cleaner usage
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Token expired or invalid
          console.error("Unauthorized - token invalid/expired");
          // Clear token
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          // Redirect to login (optional - can handle in components)
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          break;

        case 403:
          console.error("Forbidden - insufficient permissions");
          break;

        case 404:
          console.error("Resource not found");
          break;

        case 429:
          console.error("Too many requests - rate limited");
          break;

        case 500:
          console.error("Server error");
          break;

        default:
          console.error(`API Error ${status}:`, data?.message || error.message);
      }

      // Return normalized error
      return Promise.reject({
        status,
        message: data?.message || error.message,
        data: data,
      });
    }

    // Network error or request setup error
    if (error.request) {
      console.error("Network error - no response received");
      return Promise.reject({
        status: 0,
        message: "Network error. Please check your connection.",
        data: null,
      });
    }

    // Request setup error
    console.error("Request setup error:", error.message);
    return Promise.reject({
      status: -1,
      message: error.message,
      data: null,
    });
  }
);

export default api;