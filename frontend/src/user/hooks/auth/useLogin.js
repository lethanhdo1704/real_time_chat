// frontend/src/hooks/auth/useLogin.js
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../context/AuthContext";

export function useLogin() {
  const { t, i18n } = useTranslation("login");
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
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Handle redirect after login
  useEffect(() => {
    if (user && loginSuccess) {
      console.log('✅ [useLogin] User logged in, processing redirect...');
      
      const pendingInviteCode = sessionStorage.getItem('pendingInviteCode');
      if (pendingInviteCode) {
        navigate(`/join/${pendingInviteCode}`);
        setLoginSuccess(false);
        return;
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPath = urlParams.get('redirect');
      if (redirectPath) {
        navigate(redirectPath);
        setLoginSuccess(false);
        return;
      }
      
      navigate('/');
      setLoginSuccess(false);
    }
  }, [user, loginSuccess, navigate]);

  // Format date according to user's locale
  const formatBanDate = (isoDate) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleString(i18n.language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Failed to format ban date:', e);
      return isoDate;
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLoginSuccess(false);

    try {
      console.log('🔐 [useLogin] Attempting login...');
      await login(email, password, rememberMe);
      setLoginSuccess(true);
      console.log('✅ [useLogin] Login successful');
    } catch (err) {
      console.error('❌ [useLogin] Login failed:', err);
      
      if (err.response?.data?.code === 'ACCOUNT_BANNED') {
        const { banEndAt, isPermanent } = err.response.data;
        
        let errorMessage = t("errors.accountBanned");
        
        if (isPermanent) {
          errorMessage = t("errors.accountBannedPermanent");
        } else if (banEndAt) {
          const formattedDate = formatBanDate(banEndAt);
          errorMessage = t("errors.accountBannedTemporary", { date: formattedDate });
        }
        
        setError(errorMessage);
      } else if (err.response?.data?.error) {
        const backendError = err.response.data.error;
        const errorMap = {
          "Invalid credentials": t("errors.invalidCredentials"),
          "Missing email or password": t("errors.missingFields"),
          "Email không hợp lệ": t("errors.invalidEmail"),
          "Server error": t("errors.serverError"),
        };
        setError(errorMap[backendError] || backendError);
      } else if (err.request) {
        setError(t("errors.networkError"));
      } else {
        setError(t("errors.serverError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const clearError = () => {
    setError("");
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    rememberMe,
    setRememberMe,
    error,
    loading,
    loginSuccess,
    clearError,
    handleSubmit,
  };
}