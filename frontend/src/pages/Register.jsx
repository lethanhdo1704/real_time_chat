// frontend/src/pages/Register.jsx
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import { RegisterForm } from "../components/Register";
import { useOTPTimer } from "../hooks/useOTPTimer";
import { useOTPInput } from "../hooks/useOTPInput";
import { useRegisterValidation } from "../hooks/useRegisterValidation";

export default function Register() {
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
  
  // OTP states
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
    validateEmail,
    validateNickname,
    validatePassword,
    validateConfirmPassword,
    validateOTP,
  } = useRegisterValidation(t);

  // Derive otpSent from timer
  const otpSent = timer > 0;

  // Send OTP
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

  // Register
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
        nickname, 
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

  return (
    <RegisterForm
      // Form values
      nickname={nickname}
      setNickname={setNickname}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      captcha={captcha}
      setCaptcha={setCaptcha}
      
      // OTP
      otp={otp}
      otpRefs={otpRefs}
      otpSent={otpSent}
      otpMessage={otpMessage}
      handleOtpChange={handleOtpChange}
      handleOtpKeyDown={handleOtpKeyDown}
      handleOtpPaste={handleOtpPaste}
      handleSendOTP={handleSendOTP}
      
      // Timer
      timer={timer}
      formatTimer={formatTimer}
      
      // States
      error={error}
      sendingOTP={sendingOTP}
      submitting={submitting}
      
      // Submit
      onSubmit={handleSubmit}
    />
  );
}