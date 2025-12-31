// frontend/src/hooks/useLogin.js
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../context/AuthContext";

/**
 * Custom hook để quản lý toàn bộ logic login
 * Tách biệt business logic khỏi UI components
 */
export function useLogin() {
  const { t } = useTranslation("login");
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password, rememberMe);
      // Navigation handled by useEffect when user changes
    } catch (err) {
      // Xử lý error message dựa trên response từ server
      if (err.response?.data?.error) {
        const backendError = err.response.data.error;
        
        // Map backend error sang translation key
        const errorMap = {
          "Invalid credentials": t("errors.invalidCredentials"),
          "Missing email or password": t("errors.missingFields"),
          "Email không hợp lệ": t("errors.invalidEmail"),
          "Server error": t("errors.serverError"),
        };
        
        // Nếu có trong map thì dùng translation, không thì hiển thị message gốc
        setError(errorMap[backendError] || backendError);
      } else if (err.request) {
        // Request được gửi nhưng không nhận được response
        setError(t("errors.networkError"));
      } else {
        // Lỗi khác
        setError(t("errors.serverError"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Clear error when user types
  const clearError = () => {
    setError("");
  };

  return {
    // Form values
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    rememberMe,
    setRememberMe,
    
    // UI states
    error,
    loading,
    clearError,
    
    // Handlers
    handleSubmit,
  };
}