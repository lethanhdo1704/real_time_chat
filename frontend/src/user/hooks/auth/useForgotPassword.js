// frontend/src/hooks/useForgotPassword.js
import { useState, useContext, useEffect } from "react"; // ← Thêm useEffect
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../context/AuthContext";

export function useForgotPassword() {
  const { t } = useTranslation("forgotPassword");
  const { sendForgotOTP, verifyForgotOTP } = useContext(AuthContext);
  const navigate = useNavigate();

  // States
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(0);
  const [otpMessage, setOtpMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================
  // COUNTDOWN TIMER
  // =====================
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // =====================
  // VALIDATION
  // =====================
  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!regex.test(email.trim())) return t("errors.emailInvalid");
    return "";
  };

  const validatePassword = (pw) => {
    if (pw.length < 6) return t("errors.passwordTooShort");
    if (!/[A-Za-z]/.test(pw)) return t("errors.passwordNoLetters");
    if (!/[0-9]/.test(pw)) return t("errors.passwordNoNumbers");
    return "";
  };

  // =====================
  // SEND OTP
  // =====================
  const handleSendOTP = async (e, onSuccess) => {
    e.preventDefault();
    setError("");
    setOtpMessage("");
    setSuccessMessage("");
    
    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);

    try {
      setLoading(true);
      await sendForgotOTP(email);
      
      setStep(2);
      setTimer(300); // 5 minutes
      setOtpMessage(t("form.otp.sent"));
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      console.error("Send OTP error:", err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          t("errors.sendOTPFailed");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // RESET PASSWORD
  // =====================
  const handleResetPassword = async (e, otpValue) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const pwErr = validatePassword(newPassword);
    if (pwErr) return setError(pwErr);

    if (newPassword !== confirmPassword) {
      return setError(t("errors.passwordMismatch"));
    }

    if (otpValue.length !== 6) {
      return setError(t("errors.otpIncomplete"));
    }

    try {
      setLoading(true);
      await verifyForgotOTP({ email, otp: otpValue, newPassword });
      
      setSuccessMessage(t("messages.success"));
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      console.error("Reset password error:", err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          t("errors.resetFailed");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // RESEND OTP
  // =====================
  const handleResendOTP = async (onSuccess) => {
    setError("");
    setOtpMessage("");
    setSuccessMessage("");
    
    try {
      setLoading(true);
      await sendForgotOTP(email);
      
      setTimer(300); // 5 minutes
      setOtpMessage(t("form.otp.resent"));
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          t("errors.resendFailed");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    // States
    email,
    setEmail,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    step,
    setStep,
    timer, // ← Timer được quản lý trong hook
    otpMessage,
    successMessage,
    error,
    loading,
    
    // Handlers
    handleSendOTP,
    handleResetPassword,
    handleResendOTP,
  };
}

export default useForgotPassword;