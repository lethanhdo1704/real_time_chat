// frontend/src/hooks/useLogin.js
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";

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
      setError(err.response?.data?.error || t("errors.serverError"));
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