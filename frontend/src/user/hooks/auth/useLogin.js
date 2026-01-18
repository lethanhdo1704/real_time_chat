// frontend/src/hooks/auth/useLogin.js - FIXED WITH REDIRECT HANDLING
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../context/AuthContext";

/**
 * Custom hook để quản lý toàn bộ logic login
 * 🔥 UPDATED: Xử lý redirect sau login (invite links, return URLs)
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
  const [loginSuccess, setLoginSuccess] = useState(false); // 🔥 NEW

  // 🔥 UPDATED: Handle redirect after login
  useEffect(() => {
    if (user && loginSuccess) {
      console.log('✅ [useLogin] User logged in, processing redirect...');
      
      // Priority 1: Check for pending invite code (from /join/:code)
      const pendingInviteCode = sessionStorage.getItem('pendingInviteCode');
      
      if (pendingInviteCode) {
        console.log('🔗 [useLogin] Found pending invite code:', pendingInviteCode);
        // Don't clear sessionStorage here - let JoinViaLink handle it
        navigate(`/join/${pendingInviteCode}`);
        setLoginSuccess(false); // Reset flag
        return;
      }
      
      // Priority 2: Check URL redirect param
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPath = urlParams.get('redirect');
      
      if (redirectPath) {
        console.log('🔗 [useLogin] Redirecting to URL param:', redirectPath);
        navigate(redirectPath);
        setLoginSuccess(false); // Reset flag
        return;
      }
      
      // Priority 3: Default to home
      console.log('🏠 [useLogin] Redirecting to home');
      navigate('/');
      setLoginSuccess(false); // Reset flag
    }
  }, [user, loginSuccess, navigate]);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLoginSuccess(false); // Reset before login

    try {
      console.log('🔐 [useLogin] Attempting login...');
      await login(email, password, rememberMe);
      
      // 🔥 Set success flag to trigger redirect
      setLoginSuccess(true);
      console.log('✅ [useLogin] Login successful');
    } catch (err) {
      console.error('❌ [useLogin] Login failed:', err);
      
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
    loginSuccess, // 🔥 NEW: Export success state
    clearError,
    
    // Handlers
    handleSubmit,
  };
}