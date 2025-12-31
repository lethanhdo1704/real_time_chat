// frontend/src/hooks/useRegister.js
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../context/AuthContext";
import { useOTPTimer } from "./useOTPTimer";
import { useOTPInput } from "./useOTPInput";
import { useRegisterValidation } from "./useRegisterValidation";

export function useRegister() {
  const { t } = useTranslation("register");
  const navigate = useNavigate();
  const { register, sendRegisterOTP } = useContext(AuthContext);

  // Form states
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [sendingOTP, setSendingOTP] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  // Custom hooks
  const { timer, startTimer, formatTimer } = useOTPTimer();
  const {
    otp,
    otpRefs,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    focusFirstInput,
    getOtpValue,
  } = useOTPInput();
  
  const {
    normalizeNickname,
    validateEmail,
    validateNickname,
    validatePassword,
    validateConfirmPassword,
    validateOTP,
  } = useRegisterValidation(t);

  // Derive otpSent from timer
  const otpSent = timer > 0;

  // =====================
  // SEND OTP
  // =====================
  const handleSendOTP = async () => {
    setError("");
    setOtpMessage("");
    
    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);

    try {
      setSendingOTP(true);
      await sendRegisterOTP(email);
      startTimer(300);
      setOtpMessage(t("otpSentSuccess"));
      focusFirstInput();
    } catch (err) {
      console.error("Send OTP error:", err.response?.data || err);
      setError(err.response?.data?.error || t("validation.cannotSendOtp"));
    } finally {
      setSendingOTP(false);
    }
  };

  // =====================
  // REGISTER
  // =====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate captcha
    if (!captcha) {
      return setError(t("validation.pleaseVerifyCaptcha"));
    }

    // Validate all fields
    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);

    const nickErr = validateNickname(nickname);
    if (nickErr) return setError(nickErr);

    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);

    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) return setError(confirmErr);

    const otpErr = validateOTP(otp);
    if (otpErr) return setError(otpErr);

    try {
      setSubmitting(true);
      await register({ 
        nickname: normalizeNickname(nickname), // ← Normalize trước khi gửi
        email, 
        password, 
        otp: getOtpValue() 
      });
      navigate("/login");
    } catch (err) {
      console.error("Register error:", err.response?.data || err);
      setError(err.response?.data?.error || t("errors.serverError"));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    // Form values
    nickname,
    setNickname,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    captcha,
    setCaptcha,
    
    // OTP
    otp,
    otpRefs,
    otpSent,
    otpMessage,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleSendOTP,
    
    // Timer
    timer,
    formatTimer,
    
    // States
    error,
    sendingOTP,
    submitting,
    
    // Submit
    onSubmit: handleSubmit,
  };
}

export default useRegister;